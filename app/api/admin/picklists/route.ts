import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for picklist creation
const createPicklistSchema = z.object({
  orderId: z.string(),
  assignedTo: z.string().optional(),
});

// Validation schema for picklist updates
const updatePicklistSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedTo: z.string().optional(),
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
    const assignedTo = searchParams.get("assignedTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    // Fetch picklists with related data
    const [picklists, total] = await Promise.all([
      prisma.picklist.findMany({
        where,
        include: {
          order: {
            include: {
              customer: true,
              user: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              username: true,
            },
          },
          pickItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  brand: true,
                  ean: true,
                  barcode: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.picklist.count({ where }),
    ]);

    return NextResponse.json({
      picklists,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching picklists:", error);
    return NextResponse.json(
      { error: "Failed to fetch picklists" },
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
    const validatedData = createPicklistSchema.parse(body);

    // Check if order exists and is approved
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved orders can have picklists" },
        { status: 400 }
      );
    }

    // Check if picklist already exists for this order
    const existingPicklist = await prisma.picklist.findUnique({
      where: { orderId: validatedData.orderId },
    });

    if (existingPicklist) {
      return NextResponse.json(
        { error: "Picklist already exists for this order" },
        { status: 400 }
      );
    }

    // Create picklist and picklist items
    const picklist = await prisma.picklist.create({
      data: {
        orderId: validatedData.orderId,
        assignedTo: validatedData.assignedTo,
        pickItems: {
          create: order.orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        order: {
          include: {
            customer: true,
            user: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
          },
        },
        pickItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                ean: true,
                barcode: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(picklist, { status: 201 });
  } catch (error) {
    console.error("Error creating picklist:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create picklist" },
      { status: 500 }
    );
  }
} 