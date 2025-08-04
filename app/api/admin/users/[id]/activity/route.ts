import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";

    // Build where clause for audit logs
    const where: Record<string, unknown> = { userId: id };

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    // Fetch user activity logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get user login history (if available)
    const loginHistory = await prisma.auditLog.findMany({
      where: {
        userId: id,
        action: "LOGIN",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    // Get user statistics
    const stats = await prisma.auditLog.groupBy({
      by: ["action"],
      where: { userId: id },
      _count: {
        action: true,
      },
    });

    return NextResponse.json({
      logs,
      loginHistory,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json({ error: "Failed to fetch user activity" }, { status: 500 });
  }
}
