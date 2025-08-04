import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateProductPrice } from "@/lib/pricing";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = id;

    // Get product with images
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        status: "ACTIEF", // Only show active products
        isActive: true,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get review stats for this product
    const reviewStats = await prisma.review.groupBy({
      by: ["productId"],
      where: {
        productId: productId,
        status: "APPROVED",
      },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });

    const reviewStatsData =
      reviewStats.length > 0
        ? {
            averageRating: reviewStats[0]._avg.rating || 0,
            totalReviews: reviewStats[0]._count.id,
          }
        : { averageRating: 0, totalReviews: 0 };

    // Get customer-specific pricing if user is a buyer
    let customerPricing = null;
    if (session.user.role === "buyer" && session.user.customerId) {
      try {
        customerPricing = await calculateProductPrice(productId, session.user.customerId, 1);
      } catch (error) {
        console.error("Error calculating customer pricing:", error);
      }
    }

    // Transform product to match expected format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      content: product.content,
      ean: product.ean,
      purchasePrice: Number(product.purchasePrice),
      retailPrice: Number(product.retailPrice),
      stockQuantity: product.stockQuantity,
      maxOrderableQuantity: product.maxOrderableQuantity,
      starRating: product.starRating,
      category: product.category,
      subcategory: product.subcategory,
      description: product.description,
      tags: product.tags,
      isActive: product.isActive,
      status: product.status,
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.alt,
        isMain: image.isMain,
      })),
      reviewStats: reviewStatsData,
      // Customer-specific pricing
      customerPrice: customerPricing ? customerPricing.finalPrice : null,
      customerPricing: customerPricing
        ? {
            basePrice: customerPricing.basePrice,
            marginAmount: customerPricing.marginAmount,
            marginPercentage: customerPricing.marginPercentage,
            finalPrice: customerPricing.finalPrice,
            discountAmount: customerPricing.discountAmount,
            discountPercentage: customerPricing.discountPercentage,
          }
        : null,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
