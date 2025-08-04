import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for customer update
const updateCustomerSchema = z.object({
  name: z.string().min(1, "Naam is verplicht").optional(),
  email: z.string().email("Geldig email adres is verplicht").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  generalMargin: z.number().min(0).max(100).optional(),
  minimumOrderValue: z.number().min(0).optional(),
  minimumOrderItems: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        customerMargins: true,
        customerPrices: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                content: true,
              },
            },
          },
        },
        customerDiscounts: true,
        hiddenCategories: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    brand: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            customerMargins: true,
            customerPrices: true,
            customerDiscounts: true,
            hiddenCategories: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customer",
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
    const updateData = updateCustomerSchema.parse(body);

    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: updateData.email,
          id: { not: id },
        },
      });

      if (existingCustomer) {
        return NextResponse.json(
          {
            error: "Email adres is al in gebruik",
          },
          { status: 400 },
        );
      }
    }

    // Prepare update object with explicit undefined for missing fields
    const updateFields = [
      "name",
      "email",
      "phone",
      "address",
      "generalMargin",
      "minimumOrderValue",
      "minimumOrderItems",
      "isActive",
    ] as const;
    const prismaUpdateData: Record<string, unknown> = {};
    for (const field of updateFields) {
      prismaUpdateData[field] = Object.prototype.hasOwnProperty.call(updateData, field)
        ? (updateData as Record<string, unknown>)[field]
        : undefined;
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        customerMargins: true,
        customerPrices: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brand: true,
                content: true,
              },
            },
          },
        },
        customerDiscounts: true,
        hiddenCategories: true,
        _count: {
          select: {
            orders: true,
            customerMargins: true,
            customerPrices: true,
            customerDiscounts: true,
            hiddenCategories: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Customer",
        entityId: customer.id,
        details: {
          customerId: customer.id,
          customerName: customer.name,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid customer data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update customer",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer before deletion for logging
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Check if customer has active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        customerId: id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (activeOrders) {
      return NextResponse.json(
        {
          error: "Cannot delete customer with active orders",
        },
        { status: 400 },
      );
    }

    // Soft delete by setting isActive to false
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "Customer",
        entityId: customer.id,
        details: {
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      {
        error: "Failed to delete customer",
      },
      { status: 500 },
    );
  }
}
