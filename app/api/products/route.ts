import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateProductPrice } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";
    const content = searchParams.get("content") || "";
    const availability = searchParams.get("availability") || "";
    // Advanced filters
    const minRating = searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!)
      : null;
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : null;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : null;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where clause - only show ACTIEF products for buyers
    const where: Record<string, unknown> = {
      status: "ACTIEF", // Only show active products
      isActive: true,
    };

    // Add search filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { ean: { contains: search } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (brand) {
      where.brand = brand;
    }

    if (content) {
      where.content = content;
    }

    // Add availability filter
    if (availability === "available") {
      where.stockQuantity = { gt: 0 };
    } else if (availability === "outOfStock") {
      where.stockQuantity = 0;
    }

    // Add category filter
    if (category) {
      where.category = category;
    }

    // Add subcategory filter
    if (subcategory) {
      where.subcategory = subcategory;
    }

    // Add price range filter (will be applied after pricing calculation)
    // Add tag filter
    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Get products with images
    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get review stats for all products
    const productIds = products.map((p) => p.id);
    const reviewStats = await prisma.review.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        status: "APPROVED",
      },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });

    // Create a map of productId to review stats
    const reviewStatsMap = new Map();
    reviewStats.forEach((stat) => {
      reviewStatsMap.set(stat.productId, {
        averageRating: stat._avg.rating || 0,
        totalReviews: stat._count.id,
      });
    });

    // Get customer-specific pricing if user is a buyer
    const customerPricingMap = new Map();
    if (session.user.role === "BUYER" && session.user.customerId) {
      try {
        const pricingResults = await Promise.all(
          products.map(async (product) => {
            try {
              const pricing = await calculateProductPrice(product.id, session.user.customerId!, 1);
              return {
                productId: product.id,
                pricing,
              };
            } catch (error) {
              console.error(`Error calculating price for product ${product.id}:`, error);
              return {
                productId: product.id,
                pricing: null,
              };
            }
          }),
        );

        pricingResults.forEach((result) => {
          if (result.pricing) {
            customerPricingMap.set(result.productId, result.pricing);
          }
        });
      } catch (error) {
        console.error("Error calculating customer pricing:", error);
      }
    }

    // Transform products to match expected format
    const transformedProducts = products.map((product) => {
      const customerPricing = customerPricingMap.get(product.id);

      return {
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
        reviewStats: reviewStatsMap.get(product.id) || { averageRating: 0, totalReviews: 0 },
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
    });

    // Apply price range filter after pricing calculation
    let filteredProducts = transformedProducts;
    if (minPrice !== null || maxPrice !== null) {
      filteredProducts = transformedProducts.filter((product) => {
        const price = product.customerPrice || product.retailPrice;
        if (minPrice !== null && price < minPrice) return false;
        if (maxPrice !== null && price > maxPrice) return false;
        return true;
      });
    }

    // Apply star rating filter
    if (minRating !== null) {
      filteredProducts = filteredProducts.filter((product) => {
        return product.reviewStats && product.reviewStats.averageRating >= minRating;
      });
    }

    return NextResponse.json({
      products: filteredProducts,
      pagination: {
        page,
        limit,
        total: filteredProducts.length,
        totalPages: Math.ceil(filteredProducts.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
