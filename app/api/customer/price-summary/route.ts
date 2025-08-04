import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "BUYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.user.id;

    // Get customer with pricing configuration
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        categoryPricing: {
          include: {
            category: true,
          },
        },
        productPricing: {
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
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get recent orders for pricing analysis
    const recentOrders = await prisma.order.findMany({
      where: {
        customerId: customerId,
        status: "APPROVED",
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                retailPrice: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Calculate pricing statistics
    const pricingStats = {
      generalMargin: customer.marginPercentage,
      totalOrders: recentOrders.length,
      averageOrderValue:
        recentOrders.length > 0
          ? recentOrders.reduce((sum, order) => {
              const orderTotal = order.orderItems.reduce(
                (itemSum, item) => itemSum + item.quantity * Number(item.price),
                0,
              );
              return sum + orderTotal;
            }, 0) / recentOrders.length
          : 0,
      categoryOverrides: customer.categoryPricing.length,
      productOverrides: customer.productPricing.length,
    };

    // Get category pricing summary
    const categoryPricing = customer.categoryPricing.map((cp) => ({
      categoryId: cp.categoryId,
      categoryName: cp.category.name,
      marginPercentage: cp.marginPercentage,
      isOverride: cp.marginPercentage !== customer.marginPercentage,
    }));

    // Get product pricing summary (limited to 10 most recent)
    const productPricing = customer.productPricing.slice(0, 10).map((pp) => ({
      productId: pp.productId,
      productName: pp.product.name,
      productBrand: pp.product.brand,
      retailPrice: pp.product.retailPrice,
      customerPrice: pp.price,
      discount: pp.product.retailPrice - pp.price,
      discountPercentage: ((pp.product.retailPrice - pp.price) / pp.product.retailPrice) * 100,
    }));

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        marginPercentage: customer.marginPercentage,
        hiddenCategories: customer.hiddenCategories,
      },
      pricingStats,
      categoryPricing,
      productPricing,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.orderItems.reduce(
          (sum, item) => sum + item.quantity * Number(item.price),
          0,
        ),
        itemCount: order.orderItems.length,
      })),
    });
  } catch (error) {
    console.error("Error fetching customer price summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
