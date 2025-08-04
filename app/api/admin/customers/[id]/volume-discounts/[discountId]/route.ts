import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for volume discount update
const volumeDiscountUpdateSchema = z.object({
  minQuantity: z.number().min(1).optional(),
  maxQuantity: z.number().min(1).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; discountId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = volumeDiscountUpdateSchema.parse(body);

    // Check for overlapping quantity ranges if minQuantity or maxQuantity is being updated
    if (validatedData.minQuantity !== undefined || validatedData.maxQuantity !== undefined) {
      const existingDiscounts = await prisma.volumeDiscount.findMany({
        where: { 
          customerId: params.id,
          id: { not: params.discountId }
        },
      });

      const currentDiscount = await prisma.volumeDiscount.findUnique({
        where: { id: params.discountId },
      });

      if (!currentDiscount) {
        return NextResponse.json({ error: "Volume discount not found" }, { status: 404 });
      }

      const newMin = validatedData.minQuantity ?? currentDiscount.minQuantity;
      const newMax = validatedData.maxQuantity ?? currentDiscount.maxQuantity;

      const hasOverlap = existingDiscounts.some(discount => {
        const existingMin = discount.minQuantity;
        const existingMax = discount.maxQuantity || Infinity;
        const checkMax = newMax || Infinity;

        return (newMin <= existingMax && checkMax >= existingMin);
      });

      if (hasOverlap) {
        return NextResponse.json(
          { error: "Quantity range overlaps with existing discount" },
          { status: 400 }
        );
      }
    }

    const volumeDiscount = await prisma.volumeDiscount.update({
      where: { id: params.discountId },
      data: validatedData,
    });

    return NextResponse.json(volumeDiscount);
  } catch (error) {
    console.error("Error updating volume discount:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update volume discount" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; discountId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.volumeDiscount.delete({
      where: { id: params.discountId },
    });

    return NextResponse.json({ message: "Volume discount deleted successfully" });
  } catch (error) {
    console.error("Error deleting volume discount:", error);
    return NextResponse.json(
      { error: "Failed to delete volume discount" },
      { status: 500 }
    );
  }
} 