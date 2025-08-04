import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { getAuditLogs, AuditAction, AuditEntity } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    await requireAdmin();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action") || undefined;
    const entity = searchParams.get("entity") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    // Parse dates if provided
    const startDateParsed = startDate ? new Date(startDate) : undefined;
    const endDateParsed = endDate ? new Date(endDate) : undefined;

    // Get audit logs
    const result = await getAuditLogs({
      page,
      limit,
      ...(action && { action: action as AuditAction }),
      ...(entity && { entity: entity as AuditEntity }),
      ...(userId && { userId }),
      ...(startDateParsed && { startDate: startDateParsed }),
      ...(endDateParsed && { endDate: endDateParsed }),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
