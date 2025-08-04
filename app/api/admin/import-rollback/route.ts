import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-utils";
import { ImportRollback } from "@/lib/import/importRollback";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const importId = searchParams.get("importId");
    const strategy = searchParams.get("strategy") as "all" | "failed_only" | "selective";

    if (!importId) {
      return NextResponse.json({ error: "Import ID is required" }, { status: 400 });
    }

    const rollback = new ImportRollback(importId);
    const preview = await rollback.getRollbackPreview(strategy || "all");

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Rollback preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { importId, rollbackStrategy, confirmRollback, backupBeforeRollback } = body;

    if (!importId) {
      return NextResponse.json({ error: "Import ID is required" }, { status: 400 });
    }

    if (!confirmRollback) {
      return NextResponse.json({ error: "Rollback must be confirmed" }, { status: 400 });
    }

    const rollback = new ImportRollback(importId);
    const result = await rollback.executeRollback({
      importId,
      rollbackStrategy: rollbackStrategy || "all",
      confirmRollback,
      backupBeforeRollback: backupBeforeRollback || false,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Rollback execution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
