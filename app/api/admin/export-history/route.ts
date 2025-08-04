import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const exportType = searchParams.get("exportType");
    const exportFormat = searchParams.get("exportFormat");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (exportType) {
      where.exportType = exportType;
    }

    if (exportFormat) {
      where.exportFormat = exportFormat;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {} as { gte?: Date; lte?: Date };
      if (startDate) {
        (where.createdAt as { gte?: Date; lte?: Date }).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as { gte?: Date; lte?: Date }).lte = new Date(endDate);
      }
    }

    // Fetch export history with related data
    const exportHistory = await prisma.exportHistory.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.exportHistory.count({ where });

    // Get unique values for filters
    const exportTypes = await prisma.exportHistory.findMany({
      select: { exportType: true },
      distinct: ["exportType"],
    });

    const exportFormats = await prisma.exportHistory.findMany({
      select: { exportFormat: true },
      distinct: ["exportFormat"],
    });

    const statuses = await prisma.exportHistory.findMany({
      select: { status: true },
      distinct: ["status"],
    });

    return NextResponse.json({
      exportHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        exportTypes: exportTypes.map((item) => item.exportType),
        exportFormats: exportFormats.map((item) => item.exportFormat),
        statuses: statuses.map((item) => item.status),
      },
    });
  } catch (error) {
    console.error("Error fetching export history:", error);
    return NextResponse.json({ error: "Failed to fetch export history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      exportType,
      exportFormat,
      fileName,
      fileSize,
      parameters,
      recordCount,
      errors,
      status = "SUCCESS",
    } = body;

    // Validate required fields
    if (!exportType || !exportFormat || !fileName || !parameters || recordCount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create export history record
    const exportHistory = await prisma.exportHistory.create({
      data: {
        userId: session.user.id,
        exportType,
        exportFormat,
        fileName,
        fileSize,
        parameters,
        recordCount,
        errors,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ exportHistory }, { status: 201 });
  } catch (error) {
    console.error("Error creating export history:", error);
    return NextResponse.json({ error: "Failed to create export history" }, { status: 500 });
  }
}
