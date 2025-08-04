import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for picklist updates
const updatePicklistSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedTo: z.string().optional(),
});

// Validation schema for pick item updates
const updatePickItemSchema = z.object({
  picked: z.number().min(0).optional(),
  status: z.enum(["PENDING", "PICKED", "PARTIALLY_PICKED", "OUT_OF_STOCK"]).optional(),
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

    const picklist = await prisma.picklist.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            customer: true,
            user: true,
            orderItems: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
          },
        },
        pickItems: {
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
        },
      },
    });

    if (!picklist) {
      return NextResponse.json({ error: "Picklist not found" }, { status: 404 });
    }

    return NextResponse.json(picklist);
  } catch (error) {
    console.error("Error fetching picklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch picklist" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const validatedData = updatePicklistSchema.parse(body);

    const updateData: any = {};
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === "IN_PROGRESS") {
        updateData.startedAt = new Date();
      } else if (validatedData.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }
    if (validatedData.assignedTo !== undefined) {
      updateData.assignedTo = validatedData.assignedTo;
    }

    const picklist = await prisma.picklist.update({
      where: { id: params.id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true,
            user: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
          },
        },
        pickItems: {
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
        },
      },
    });

    return NextResponse.json(picklist);
  } catch (error) {
    console.error("Error updating picklist:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update picklist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.picklist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Picklist deleted successfully" });
  } catch (error) {
    console.error("Error deleting picklist:", error);
    return NextResponse.json(
      { error: "Failed to delete picklist" },
      { status: 500 }
    );
  }
} 