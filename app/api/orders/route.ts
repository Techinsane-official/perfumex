import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOrderPricing, validateOrder } from "@/lib/pricing";
import { z } from "zod";

// Schema for order creation
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
  notes: z.string().optional(),
  customerId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, notes, customerId } = createOrderSchema.parse(body);

    // Validate order
    const validation = await validateOrder(items, customerId);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Order validation failed",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Calculate order pricing
    const orderPricing = await calculateOrderPricing(items, customerId);

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId,
        userId: (session.user as Record<string, unknown>).id as string,
        status: "PENDING",
        totalAmount: orderPricing.totalAmount,
        notes: notes || null,
      },
      include: {
        customer: true,
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Create order items
    const orderItems = await Promise.all(
      orderPricing.items.map(async (item) => {
        return prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.finalPrice,
          },
        });
      }),
    );

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        orderItems,
      },
      pricing: orderPricing,
    });
  } catch (error) {
    console.error("Error creating order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid order data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create order",
      },
      { status: 500 },
    );
  }
}

// Get orders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      userId: (session.user as Record<string, unknown>).id as string,
    };

    if (status) {
      where.status = status;
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch orders",
      },
      { status: 500 },
    );
  }
}
