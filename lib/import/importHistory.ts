import { prisma } from "@/lib/prisma";

export interface ImportHistoryEntry {
  id: string;
  filename: string;
  fileType: "csv" | "excel";
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  duplicateRows: number;
  importStrategy: "skip" | "overwrite" | "flag" | "error";
  importOnlyValid: boolean;
  startedAt: Date;
  completedAt: Date;
  duration: number; // in milliseconds
  status: "completed" | "failed" | "cancelled";
  errors: string[];
  warnings: string[];
  importedBy: string;
  notes?: string;
}

export interface CreateImportHistoryParams {
  filename: string;
  fileType: "csv" | "excel";
  totalRows: number;
  importStrategy: "skip" | "overwrite" | "flag" | "error";
  importOnlyValid: boolean;
  importedBy: string;
  notes?: string;
}

export interface UpdateImportHistoryParams {
  id: string;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  duplicateRows: number;
  status: "completed" | "failed" | "cancelled";
  errors?: string[];
  warnings?: string[];
}

export async function createImportHistory(params: CreateImportHistoryParams): Promise<string> {
  const entry = await prisma.importHistory.create({
    data: {
      filename: params.filename,
      fileType: params.fileType,
      totalRows: params.totalRows,
      successfulRows: 0,
      failedRows: 0,
      skippedRows: 0,
      duplicateRows: 0,
      importStrategy: params.importStrategy,
      importOnlyValid: params.importOnlyValid,
      startedAt: new Date(),
      status: "completed", // Will be updated during import
      errors: [],
      warnings: [],
      importedBy: params.importedBy,
      notes: params.notes,
    },
  });

  return entry.id;
}

export async function updateImportHistory(params: UpdateImportHistoryParams): Promise<void> {
  const completedAt = new Date();

  await prisma.importHistory.update({
    where: { id: params.id },
    data: {
      successfulRows: params.successfulRows,
      failedRows: params.failedRows,
      skippedRows: params.skippedRows,
      duplicateRows: params.duplicateRows,
      status: params.status,
      completedAt,
      duration:
        completedAt.getTime() -
        (await prisma.importHistory.findUnique({ where: { id: params.id } }))!.startedAt.getTime(),
      errors: params.errors || [],
      warnings: params.warnings || [],
    },
  });
}

export async function getImportHistory(
  page: number = 1,
  limit: number = 20,
  status?: "completed" | "failed" | "cancelled",
): Promise<{ entries: ImportHistoryEntry[]; total: number }> {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [entries, total] = await Promise.all([
    prisma.importHistory.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.importHistory.count({ where }),
  ]);

  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      filename: entry.filename,
      fileType: entry.fileType as "csv" | "excel",
      totalRows: entry.totalRows,
      successfulRows: entry.successfulRows,
      failedRows: entry.failedRows,
      skippedRows: entry.skippedRows,
      duplicateRows: entry.duplicateRows,
      importStrategy: entry.importStrategy as "skip" | "overwrite" | "flag" | "error",
      importOnlyValid: entry.importOnlyValid,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      duration: entry.duration,
      status: entry.status as "completed" | "failed" | "cancelled",
      errors: entry.errors as string[],
      warnings: entry.warnings as string[],
      importedBy: entry.importedBy,
      notes: entry.notes,
    })),
    total,
  };
}

export async function getImportHistoryById(id: string): Promise<ImportHistoryEntry | null> {
  const entry = await prisma.importHistory.findUnique({
    where: { id },
  });

  if (!entry) return null;

  return {
    id: entry.id,
    filename: entry.filename,
    fileType: entry.fileType as "csv" | "excel",
    totalRows: entry.totalRows,
    successfulRows: entry.successfulRows,
    failedRows: entry.failedRows,
    skippedRows: entry.skippedRows,
    duplicateRows: entry.duplicateRows,
    importStrategy: entry.importStrategy as "skip" | "overwrite" | "flag" | "error",
    importOnlyValid: entry.importOnlyValid,
    startedAt: entry.startedAt,
    completedAt: entry.completedAt,
    duration: entry.duration,
    status: entry.status as "completed" | "failed" | "cancelled",
    errors: entry.errors as string[],
    warnings: entry.warnings as string[],
    importedBy: entry.importedBy,
    notes: entry.notes,
  };
}

export async function getImportStatistics(): Promise<{
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  totalRowsImported: number;
  averageSuccessRate: number;
  recentActivity: ImportHistoryEntry[];
}> {
  const [totalImports, successfulImports, failedImports, totalRowsImported, recentActivity] =
    await Promise.all([
      prisma.importHistory.count(),
      prisma.importHistory.count({ where: { status: "completed" } }),
      prisma.importHistory.count({ where: { status: "failed" } }),
      prisma.importHistory.aggregate({
        _sum: { successfulRows: true },
      }),
      prisma.importHistory.findMany({
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);

  const averageSuccessRate =
    totalImports > 0 ? Math.round((successfulImports / totalImports) * 100) : 0;

  return {
    totalImports,
    successfulImports,
    failedImports,
    totalRowsImported: totalRowsImported._sum.successfulRows || 0,
    averageSuccessRate,
    recentActivity: recentActivity.map((entry) => ({
      id: entry.id,
      filename: entry.filename,
      fileType: entry.fileType as "csv" | "excel",
      totalRows: entry.totalRows,
      successfulRows: entry.successfulRows,
      failedRows: entry.failedRows,
      skippedRows: entry.skippedRows,
      duplicateRows: entry.duplicateRows,
      importStrategy: entry.importStrategy as "skip" | "overwrite" | "flag" | "error",
      importOnlyValid: entry.importOnlyValid,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      duration: entry.duration,
      status: entry.status as "completed" | "failed" | "cancelled",
      errors: entry.errors as string[],
      warnings: entry.warnings as string[],
      importedBy: entry.importedBy,
      notes: entry.notes,
    })),
  };
}
