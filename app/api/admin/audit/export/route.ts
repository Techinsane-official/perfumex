import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV content
    const csvHeaders = ["user", "action", "target", "timestamp", "details"];
    const csvRows = auditLogs.map((log) => [
      log.user?.username || "Unknown",
      log.action,
      log.entity || "",
      log.createdAt.toISOString(),
      log.details ? JSON.stringify(log.details) : "",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    // Log export action
    logger.logUserAction(session.user.id, "EXPORT_AUDIT_LOGS", "AUDIT_LOG", undefined, {
      filters: { startDate, endDate, userId, action, entity },
      recordCount: auditLogs.length,
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    logger.error("Failed to export audit logs", error as Error, {
      userId: "unknown",
      action: "EXPORT_AUDIT_LOGS",
    });

    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
  }
}
