import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for time period
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // Default to 30 days
    const days = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch real statistics
    const [
      totalRevenue,
      totalOrders,
      activeCustomers,
      productsSold
    ] = await Promise.all([
      // Total Revenue (sum of all order totals)
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Total Orders count
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // Active Customers (customers with orders in the period)
      prisma.customer.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      }),

      // Products Sold (sum of quantities from order items)
      prisma.orderItem.aggregate({
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _sum: {
          quantity: true
        }
      })
    ]);

    // Format the statistics
    const statistics = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders: totalOrders,
      activeCustomers: activeCustomers,
      productsSold: productsSold._sum.quantity || 0,
      period: days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
} 