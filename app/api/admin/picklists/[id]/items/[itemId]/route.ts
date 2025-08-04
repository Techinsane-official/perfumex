import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for pick item updates
const updatePickItemSchema = z.object({
  picked: z.number().min(0).optional(),
  status: z.enum(["PENDING", "PICKED", "PARTIALLY_PICKED", "OUT_OF_STOCK"]).optional(),
  scannedAt: z.boolean().optional(), // For barcode scanning
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePickItemSchema.parse(body);

    // Get current picklist item
    const currentItem = await prisma.picklistItem.findUnique({
      where: { id: params.itemId },
      include: {
        picklist: true,
        product: true,
      },
    });

    if (!currentItem) {
      return NextResponse.json({ error: "Picklist item not found" }, { status: 404 });
    }

    // Verify this item belongs to the specified picklist
    if (currentItem.picklistId !== params.id) {
      return NextResponse.json({ error: "Invalid picklist item" }, { status: 400 });
    }

    const updateData: any = {};

    // Handle barcode scanning
    if (validatedData.scannedAt) {
      updateData.scannedAt = new Date();
      // Auto-complete the item when scanned
      updateData.picked = currentItem.quantity;
      updateData.status = "PICKED";
      updateData.pickedAt = new Date();
    } else {
      // Manual updates
      if (validatedData.picked !== undefined) {
        updateData.picked = validatedData.picked;
        
        // Determine status based on picked quantity
        if (validatedData.picked === 0) {
          updateData.status = "PENDING";
        } else if (validatedData.picked === currentItem.quantity) {
          updateData.status = "PICKED";
          updateData.pickedAt = new Date();
        } else if (validatedData.picked < currentItem.quantity) {
          updateData.status = "PARTIALLY_PICKED";
        }
      }

      if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
        if (validatedData.status === "PICKED") {
          updateData.pickedAt = new Date();
        }
      }
    }

    // Update the picklist item
    const updatedItem = await prisma.picklistItem.update({
      where: { id: params.itemId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            ean: true,
            barcode: true,
            location: true,
            stockQuantity: true,
          },
        },
      },
    });

    // Check if all items in the picklist are completed
    const allItems = await prisma.picklistItem.findMany({
      where: { picklistId: params.id },
    });

    const allCompleted = allItems.every((item) => item.status === "PICKED");
    const anyInProgress = allItems.some((item) => 
      item.status === "PICKED" || item.status === "PARTIALLY_PICKED"
    );

    // Update picklist status if needed
    if (allCompleted) {
      await prisma.picklist.update({
        where: { id: params.id },
        data: { 
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } else if (anyInProgress && currentItem.picklist.status === "PENDING") {
      await prisma.picklist.update({
        where: { id: params.id },
        data: { 
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating picklist item:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update picklist item" },
      { status: 500 }
    );
  }
}

// Barcode scanning endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { barcode } = body;

    if (!barcode) {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
    }

    // Find product by barcode
    const product = await prisma.product.findFirst({
      where: { barcode: barcode },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found for barcode" }, { status: 404 });
    }

    // Get current picklist item
    const currentItem = await prisma.picklistItem.findUnique({
      where: { id: params.itemId },
      include: {
        product: true,
      },
    });

    if (!currentItem) {
      return NextResponse.json({ error: "Picklist item not found" }, { status: 404 });
    }

    // Verify barcode matches the expected product
    if (currentItem.productId !== product.id) {
      return NextResponse.json({ 
        error: "Barcode mismatch", 
        expected: currentItem.product.ean,
        scanned: barcode 
      }, { status: 400 });
    }

    // Auto-complete the item
    const updatedItem = await prisma.picklistItem.update({
      where: { id: params.itemId },
      data: {
        picked: currentItem.quantity,
        status: "PICKED",
        scannedAt: new Date(),
        pickedAt: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            ean: true,
            barcode: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
      message: "Item scanned successfully",
    });
  } catch (error) {
    console.error("Error scanning barcode:", error);
    return NextResponse.json(
      { error: "Failed to scan barcode" },
      { status: 500 }
    );
  }
} 