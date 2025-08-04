import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateProductPrice } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity = 1, customerId } = body;

    if (!productId || !customerId) {
      return NextResponse.json(
        { error: "Product ID and Customer ID are required" },
        { status: 400 },
      );
    }

    // Calculate product price
    const pricing = await calculateProductPrice(productId, customerId, quantity);

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error("Error calculating pricing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productIds = searchParams.get("productIds")?.split(",") || [];
    const customerId = searchParams.get("customerId");

    if (!customerId || productIds.length === 0) {
      return NextResponse.json(
        { error: "Customer ID and product IDs are required" },
        { status: 400 },
      );
    }

    // Calculate prices for multiple products
    const pricingResults = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const pricing = await calculateProductPrice(productId, customerId, 1);
          return {
            productId,
            pricing,
          };
        } catch (error) {
          console.error(`Error calculating price for product ${productId}:`, error);
          return {
            productId,
            pricing: null,
            error: "Failed to calculate price",
          };
        }
      }),
    );

    return NextResponse.json({
      success: true,
      results: pricingResults,
    });
  } catch (error) {
    console.error("Error calculating bulk pricing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
