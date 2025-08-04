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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
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

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get orders that can have invoices (APPROVED or REJECTED)
    const orders = await prisma.order.findMany({
      where: {
        ...where,
        status: {
          in: ["APPROVED", "REJECTED"],
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        totalAmount: true,
        orderItems: {
          select: {
            quantity: true,
            price: true,
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
    const totalOrders = await prisma.order.count({
      where: {
        ...where,
        status: {
          in: ["APPROVED", "REJECTED"],
        },
      },
    });

    const totalPages = Math.ceil(totalOrders / limit);

    // Calculate totals and format data
    const invoices = orders.map((order) => {
      const totalAmount = order.orderItems.reduce(
        (sum, item) => sum + item.quantity * Number(item.price),
        0,
      );

      return {
        id: order.id,
        invoiceNumber: `INV-${order.id.slice(-8)}`,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount,
        itemCount: order.orderItems.length,
        downloadUrl: `/api/customer/orders/${order.id}/pdf`,
      };
    });

    return NextResponse.json({
      invoices,
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
    console.error("Error fetching customer invoices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
