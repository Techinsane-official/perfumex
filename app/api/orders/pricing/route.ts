import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateOrderPricing } from "@/lib/pricing";
import { z } from "zod";

// Schema for pricing calculation
const pricingRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = pricingRequestSchema.parse(body);

    // Get customer ID from session (assuming buyer role)
    const customerId = (session.user as Record<string, unknown>).customerId as string;
    if (!customerId) {
      return NextResponse.json({ error: "Customer ID not found" }, { status: 400 });
    }

    // Calculate pricing
    const pricing = await calculateOrderPricing(items, customerId);

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Error calculating pricing:", error);

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
        error: "Failed to calculate pricing",
      },
      { status: 500 },
    );
  }
}
