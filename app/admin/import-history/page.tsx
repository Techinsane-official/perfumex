"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  RotateCcw,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import ImportRollbackDialog from "@/components/ui/ImportRollbackDialog";

interface ImportHistoryEntry {
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
  duration: number;
  status: "completed" | "failed" | "cancelled";
  errors: string[];
  warnings: string[];
  importedBy: string;
  notes?: string;
}

export default function ImportHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [imports, setImports] = useState<ImportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "failed" | "cancelled">(
    "all",
  );
  const [selectedImport, setSelectedImport] = useState<ImportHistoryEntry | null>(null);
  const [rollbackDialog, setRollbackDialog] = useState<{
    isOpen: boolean;
    importId: string;
    importName: string;
  }>({
    isOpen: false,
    importId: "",
    importName: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/admin");
    } else if (
      status === "authenticated" &&
      (session?.user as Record<string, unknown>)?.role !== "ADMIN"
    ) {
      router.push("/login/admin");
    }
  }, [status, session, router]);

  const fetchImportHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/import-history?page=${currentPage}&status=${statusFilter === "all" ? "" : statusFilter}`,
      );
      if (response.ok) {
        const data = await response.json();
        setImports(data.entries);
        setTotalPages(Math.ceil(data.total / 20));
      }
    } catch (error) {
      console.error("Error fetching import history:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchImportHistory();
    }
  }, [status, fetchImportHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}u ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSuccessRate = (entry: ImportHistoryEntry) => {
    if (entry.totalRows === 0) return 0;
    return Math.round((entry.successfulRows / entry.totalRows) * 100);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user as Record<string, unknown>)?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Import Geschiedenis</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welkom, {(session.user as { username?: string })?.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/admin/dashboard" />

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Overzicht</h2>
              <p className="text-gray-600">Bekijk alle import operaties en hun resultaten</p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "completed" | "failed" | "cancelled")
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="completed">Voltooid</option>
                <option value="failed">Gefaald</option>
                <option value="cancelled">Geannuleerd</option>
              </select>

              <button
                onClick={() => router.push("/admin/products/import")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Nieuwe Import
              </button>
            </div>
          </div>

          {/* Import List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {imports.map((importEntry) => (
                <div
                  key={importEntry.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedImport(importEntry)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(importEntry.status)}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(importEntry.status)}`}
                        >
                          {importEntry.status === "completed" && "Voltooid"}
                          {importEntry.status === "failed" && "Gefaald"}
                          {importEntry.status === "cancelled" && "Geannuleerd"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{importEntry.filename}</span>
                        <span className="text-sm text-gray-500">
                          ({importEntry.fileType.toUpperCase()})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(importEntry.startedAt)}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(importEntry.duration)}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{importEntry.importedBy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Totaal:</span>
                      <span className="ml-1 font-medium">{importEntry.totalRows}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Succesvol:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {importEntry.successfulRows}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Gefaald:</span>
                      <span className="ml-1 font-medium text-red-600">
                        {importEntry.failedRows}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Overgeslagen:</span>
                      <span className="ml-1 font-medium text-orange-600">
                        {importEntry.skippedRows}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duplicaten:</span>
                      <span className="ml-1 font-medium text-purple-600">
                        {importEntry.duplicateRows}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Succesrate:</span>
                      <span className="ml-1 font-medium">{getSuccessRate(importEntry)}%</span>
                    </div>
                  </div>

                  {/* Rollback Button for failed imports */}
                  {importEntry.status === "failed" && importEntry.successfulRows > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRollbackDialog({
                            isOpen: true,
                            importId: importEntry.id,
                            importName: importEntry.filename,
                          });
                        }}
                        className="flex items-center space-x-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Rollback Uitvoeren</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {imports.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Geen import geschiedenis gevonden</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Vorige
                </button>

                <span className="px-3 py-2 text-gray-700">
                  Pagina {currentPage} van {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Volgende
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Detail Modal */}
      {selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Details</h3>
              <button
                onClick={() => setSelectedImport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bestand</label>
                  <p className="text-gray-900">{selectedImport.filename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900">{selectedImport.fileType.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{selectedImport.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duur</label>
                  <p className="text-gray-900">{formatDuration(selectedImport.duration)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gestart</label>
                  <p className="text-gray-900">{formatDate(selectedImport.startedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Voltooid</label>
                  <p className="text-gray-900">{formatDate(selectedImport.completedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Geïmporteerd door</label>
                  <p className="text-gray-900">{selectedImport.importedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Strategie</label>
                  <p className="text-gray-900">{selectedImport.importStrategy}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Statistieken</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedImport.totalRows}
                    </div>
                    <div className="text-xs text-gray-600">Totaal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedImport.successfulRows}
                    </div>
                    <div className="text-xs text-gray-600">Succesvol</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {selectedImport.failedRows}
                    </div>
                    <div className="text-xs text-gray-600">Gefaald</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedImport.skippedRows}
                    </div>
                    <div className="text-xs text-gray-600">Overgeslagen</div>
                  </div>
                </div>
              </div>

              {selectedImport.errors.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-red-900 mb-2">Fouten</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    {selectedImport.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedImport.warnings.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Waarschuwingen</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    {selectedImport.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-yellow-700">
                        • {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedImport.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Opmerkingen</h4>
                  <p className="text-gray-700">{selectedImport.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rollback Dialog */}
      <ImportRollbackDialog
        isOpen={rollbackDialog.isOpen}
        onClose={() => setRollbackDialog({ isOpen: false, importId: "", importName: "" })}
        importId={rollbackDialog.importId}
        importName={rollbackDialog.importName}
      />
    </div>
  );
}
