import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for margin creation/update
const marginSchema = z.object({
  category: z.string().min(1, "Categorie is verplicht"),
  margin: z.number().min(0).max(100, "Marge moet tussen 0% en 100% liggen"),
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

    // Get customer margins
    const margins = await prisma.customerMargin.findMany({
      where: { customerId: id },
      orderBy: { category: "asc" },
    });

    return NextResponse.json(margins);
  } catch (error) {
    console.error("Error fetching customer margins:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customer margins",
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
    const marginData = marginSchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check if margin already exists for this category
    const existingMargin = await prisma.customerMargin.findUnique({
      where: {
        customerId_category: {
          customerId: id,
          category: marginData.category,
        },
      },
    });

    if (existingMargin) {
      return NextResponse.json(
        {
          error: "Margin already exists for this category",
        },
        { status: 400 },
      );
    }

    // Create margin
    const margin = await prisma.customerMargin.create({
      data: {
        customerId: id,
        category: marginData.category,
        margin: marginData.margin,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "CustomerMargin",
        entityId: margin.id,
        details: {
          customerId: id,
          customerName: customer.name,
          category: marginData.category,
          margin: marginData.margin,
        },
      },
    });

    return NextResponse.json({
      success: true,
      margin,
    });
  } catch (error) {
    console.error("Error creating customer margin:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid margin data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create customer margin",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const marginData = marginSchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Update margin
    const margin = await prisma.customerMargin.upsert({
      where: {
        customerId_category: {
          customerId: id,
          category: marginData.category,
        },
      },
      update: {
        margin: marginData.margin,
      },
      create: {
        customerId: id,
        category: marginData.category,
        margin: marginData.margin,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "CustomerMargin",
        entityId: margin.id,
        details: {
          customerId: id,
          customerName: customer.name,
          category: marginData.category,
          margin: marginData.margin,
        },
      },
    });

    return NextResponse.json({
      success: true,
      margin,
    });
  } catch (error) {
    console.error("Error updating customer margin:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid margin data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update customer margin",
      },
      { status: 500 },
    );
  }
}
