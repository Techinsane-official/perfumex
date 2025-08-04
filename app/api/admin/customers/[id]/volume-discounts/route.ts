import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for volume discount
const volumeDiscountSchema = z.object({
  minQuantity: z.number().min(1),
  maxQuantity: z.number().min(1).optional(),
  discountPercentage: z.number().min(0).max(100),
  isActive: z.boolean(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const volumeDiscounts = await prisma.volumeDiscount.findMany({
      where: { customerId: params.id },
      orderBy: { minQuantity: "asc" },
    });

    return NextResponse.json(volumeDiscounts);
  } catch (error) {
    console.error("Error fetching volume discounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch volume discounts" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = volumeDiscountSchema.parse(body);

    // Check for overlapping quantity ranges
    const existingDiscounts = await prisma.volumeDiscount.findMany({
      where: { customerId: params.id },
    });

    const hasOverlap = existingDiscounts.some(discount => {
      const newMin = validatedData.minQuantity;
      const newMax = validatedData.maxQuantity || Infinity;
      const existingMin = discount.minQuantity;
      const existingMax = discount.maxQuantity || Infinity;

      return (newMin <= existingMax && newMax >= existingMin);
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: "Quantity range overlaps with existing discount" },
        { status: 400 }
      );
    }

    const volumeDiscount = await prisma.volumeDiscount.create({
      data: {
        customerId: params.id,
        minQuantity: validatedData.minQuantity,
        maxQuantity: validatedData.maxQuantity,
        discountPercentage: validatedData.discountPercentage,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json(volumeDiscount, { status: 201 });
  } catch (error) {
    console.error("Error creating volume discount:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create volume discount" },
      { status: 500 }
    );
  }
} 