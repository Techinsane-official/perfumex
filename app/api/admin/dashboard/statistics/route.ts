import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Fetch dashboard statistics
    const [
      totalRevenue,
      totalOrders,
      activeCustomers,
      productsSold,
      totalProducts,
      totalCustomers
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
      }),

      // Total Products count
      prisma.product.count({
        where: {
          isActive: true
        }
      }),

      // Total Customers count
      prisma.customer.count({
        where: {
          isActive: true
        }
      })
    ]);

    // Format the statistics
    const statistics = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders: totalOrders,
      activeCustomers: activeCustomers,
      productsSold: productsSold._sum.quantity || 0,
      totalProducts: totalProducts,
      totalCustomers: totalCustomers,
      period: 30,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
} 