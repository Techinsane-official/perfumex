import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for customer creation
const createCustomerSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Geldig email adres is verplicht"),
  phone: z.string().optional(),
  address: z.string().optional(),
  generalMargin: z.number().min(0).max(100).default(0),
  minimumOrderValue: z.number().min(0).default(0),
  minimumOrderItems: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
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
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch customers",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const customerData = createCustomerSchema.parse(body);

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: customerData.email },
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          error: "Email adres is al in gebruik",
        },
        { status: 400 },
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        phone: customerData.phone || null,
        address: customerData.address || null,
      },
      include: {
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
        action: "CREATE",
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
      customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);

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
        error: "Failed to create customer",
      },
      { status: 500 },
    );
  }
}
