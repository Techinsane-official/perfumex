import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for order approval/rejection
const orderActionSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          user: true,
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
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch orders",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, action, reason } = orderActionSchema.parse(body);

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "Order cannot be modified in current status",
        },
        { status: 400 },
      );
    }

    // Update order status
    const updateData: Record<string, unknown> = {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      approvedBy: session.user.id,
      approvedAt: new Date(),
    };

    if (action === "REJECT" && reason) {
      updateData.rejectionReason = reason;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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

    // If approved, update stock quantities
    if (action === "APPROVE") {
      await Promise.all(
        order.orderItems.map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }),
      );
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action,
        entity: "Order",
        entityId: orderId,
        details: {
          orderId,
          action,
          reason,
          previousStatus: "PENDING",
          newStatus: updateData.status,
        } as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    console.error("Error updating order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update order",
      },
      { status: 500 },
    );
  }
}
