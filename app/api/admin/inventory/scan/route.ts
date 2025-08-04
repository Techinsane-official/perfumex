import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for inventory scan
const inventoryScanSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(0),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = inventoryScanSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create inventory scan record
    const scan = await prisma.inventoryScan.create({
      data: {
        productId: validatedData.productId,
        scannedBy: session.user.id,
        quantity: validatedData.quantity,
        location: validatedData.location,
        notes: validatedData.notes,
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
            stockQuantity: true,
          },
        },
        scanner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(scan, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory scan:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create inventory scan" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const scannedBy = searchParams.get("scannedBy");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (productId) where.productId = productId;
    if (scannedBy) where.scannedBy = scannedBy;

    // Fetch inventory scans with related data
    const [scans, total] = await Promise.all([
      prisma.inventoryScan.findMany({
        where,
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
          scanner: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { scannedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryScan.count({ where }),
    ]);

    return NextResponse.json({
      scans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching inventory scans:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory scans" },
      { status: 500 }
    );
  }
} 