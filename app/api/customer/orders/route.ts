import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "BUYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.user.customerId;
    
    if (!customerId) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      customerId: customerId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                retailPrice: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalOrders = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalOrders / limit);

    // Calculate totals for each order
    const ordersWithTotals = orders.map((order) => {
      const totalAmount = order.orderItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );

      return {
        ...order,
        totalAmount,
        itemCount: order.orderItems.length,
      };
    });

    return NextResponse.json({
      orders: ordersWithTotals,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
