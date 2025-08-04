import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for hidden category creation
const hiddenCategorySchema = z.object({
  category: z.string().min(1, "Categorie is verplicht"),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get customer hidden categories
    const hiddenCategories = await prisma.customerHiddenCategory.findMany({
      where: { customerId: id },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(hiddenCategories);
  } catch (error) {
    console.error("Error fetching customer hidden categories:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customer hidden categories",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const hiddenCategoryData = hiddenCategorySchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check if hidden category already exists
    const existingHiddenCategory = await prisma.customerHiddenCategory.findUnique({
      where: {
        customerId_category: {
          customerId: id,
          category: hiddenCategoryData.category,
        },
      },
    });

    if (existingHiddenCategory) {
      return NextResponse.json(
        {
          error: "Hidden category already exists for this customer",
        },
        { status: 400 },
      );
    }

    // Create hidden category
    const hiddenCategory = await prisma.customerHiddenCategory.create({
      data: {
        customerId: id,
        category: hiddenCategoryData.category,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "CustomerHiddenCategory",
        entityId: hiddenCategory.id,
        details: {
          customerId: id,
          customerName: customer.name,
          category: hiddenCategoryData.category,
        },
      },
    });

    return NextResponse.json({
      success: true,
      hiddenCategory,
    });
  } catch (error) {
    console.error("Error creating customer hidden category:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid hidden category data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create customer hidden category",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "Category parameter is required" }, { status: 400 });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Find and delete the hidden category
    const hiddenCategory = await prisma.customerHiddenCategory.findUnique({
      where: {
        customerId_category: {
          customerId: id,
          category: category,
        },
      },
    });

    if (!hiddenCategory) {
      return NextResponse.json({ error: "Hidden category not found" }, { status: 404 });
    }

    await prisma.customerHiddenCategory.delete({
      where: { id: hiddenCategory.id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "CustomerHiddenCategory",
        entityId: hiddenCategory.id,
        details: {
          customerId: id,
          customerName: customer.name,
          category: category,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hidden category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer hidden category:", error);
    return NextResponse.json(
      {
        error: "Failed to delete customer hidden category",
      },
      { status: 500 },
    );
  }
}
