import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for POS transaction
const posTransactionSchema = z.object({
  sessionId: z.string(),
  customerId: z.string().optional(),
  subtotal: z.number().positive(),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_PAYMENT", "GIFT_CARD", "OTHER"]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]).default("PAID"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
    discount: z.number().min(0).default(0),
    notes: z.string().optional(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const sessionId = searchParams.get("sessionId");
    const customerId = searchParams.get("customerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (sessionId) where.sessionId = sessionId;
    if (customerId) where.customerId = customerId;

    const transactions = await prisma.pOSTransaction.findMany({
      where,
      include: {
        session: {
          include: {
            operator: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                ean: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.pOSTransaction.count({ where });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching POS transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch POS transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = posTransactionSchema.parse(body);

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction with items in a transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the main transaction
      const posTransaction = await tx.pOSTransaction.create({
        data: {
          transactionId,
          sessionId: validatedData.sessionId,
          userId: session.user.id,
          customerId: validatedData.customerId,
          status: "COMPLETED",
          subtotal: validatedData.subtotal,
          tax: validatedData.tax,
          discount: validatedData.discount,
          total: validatedData.total,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: validatedData.paymentStatus,
          notes: validatedData.notes,
        },
      });

      // Create transaction items
      const items = await Promise.all(
        validatedData.items.map((item) =>
          tx.pOSItem.create({
            data: {
              transactionId: posTransaction.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              discount: item.discount,
              notes: item.notes,
            },
          })
        )
      );

      // Update product stock quantities
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Update POS session totals
      await tx.pOSSession.update({
        where: { id: validatedData.sessionId },
        data: {
          totalAmount: {
            increment: validatedData.total,
          },
          totalItems: {
            increment: validatedData.items.reduce((sum, item) => sum + item.quantity, 0),
          },
        },
      });

      return { transaction: posTransaction, items };
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating POS transaction:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid transaction data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create POS transaction" },
      { status: 500 }
    );
  }
} 