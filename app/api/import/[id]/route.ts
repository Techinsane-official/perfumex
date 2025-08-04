import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Zod schema for import ID parameter
const importIdSchema = z.object({
  id: z.string().min(1, "Import ID is required"),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    // Parse and validate import ID
    const { id } = await params;
    const validatedData = importIdSchema.parse({ id });

    // Get import history with related data
    const importHistory = await prisma.importHistory.findUnique({
      where: { id: validatedData.id },
      include: {
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        rollbacks: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!importHistory) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    // Get user who performed the import
    const importUser = await prisma.user.findUnique({
      where: { id: importHistory.importedBy },
      select: { username: true },
    });

    // Get user who performed rollback if exists
    let rollbackUser = null;
    if (importHistory.rollbacks.length > 0) {
      rollbackUser = await prisma.user.findUnique({
        where: { id: importHistory.rollbacks[0].rolledBackBy },
        select: { username: true },
      });
    }

    // Prepare response data
    const response = {
      id: importHistory.id,
      fileName: importHistory.fileName,
      fileType: importHistory.fileType,
      entityType: importHistory.entityType,
      totalRows: importHistory.totalRows,
      importedRows: importHistory.importedRows,
      failedRows: importHistory.failedRows,
      errors: importHistory.errors,
      importedBy: importUser?.username || "Unknown",
      createdAt: importHistory.createdAt,
      hasSnapshot: importHistory.snapshots.length > 0,
      hasRollback: importHistory.rollbacks.length > 0,
      rollbackInfo:
        importHistory.rollbacks.length > 0
          ? {
              rolledBackBy: rollbackUser?.username || "Unknown",
              entitiesRestored: importHistory.rollbacks[0].entitiesRestored,
              rollbackReason: importHistory.rollbacks[0].rollbackReason,
              rolledBackAt: importHistory.rollbacks[0].createdAt,
            }
          : null,
      canRollback: importHistory.rollbacks.length === 0 && importHistory.snapshots.length > 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get import error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid import ID", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
