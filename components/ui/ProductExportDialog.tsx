"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Filter,
  Columns,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { ExportTemplateManager } from "./ExportTemplateManager";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportFilters {
  brand?: string;
  category?: string;
  subcategory?: string;
  availability?: "in_stock" | "out_of_stock" | "all";
  minRating?: number | undefined;
  maxRating?: number | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  search?: string;
}

interface ProductExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: {
    search?: string;
    brand?: string;
    content?: string;
    availability?: string;
  };
}

export default function ProductExportDialog({
  isOpen,
  onClose,
  currentFilters,
}: ProductExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<ExportColumn[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [format, setFormat] = useState<"csv" | "excel">("csv");
  const [filters, setFilters] = useState<ExportFilters>(() => {
    const baseFilters: ExportFilters = { availability: "all" };

    if (currentFilters) {
      return {
        ...baseFilters,
        search: currentFilters.search,
        brand: currentFilters.brand,
        availability:
          currentFilters.availability === "available"
            ? "in_stock"
            : currentFilters.availability === "outOfStock"
              ? "out_of_stock"
              : "all",
      };
    }

    return baseFilters;
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableColumns();
    }
  }, [isOpen]);

  const fetchAvailableColumns = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/products/export");
      if (response.ok) {
        const data = await response.json();
        setAvailableColumns(data.availableColumns);
        // Select all columns by default
        setSelectedColumns(data.availableColumns.map((col: ExportColumn) => col.key));
      }
    } catch (error) {
      console.error("Error fetching export columns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await fetch("/api/admin/products/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          columns: selectedColumns,
          filters,
          includePricing: false,
        }),
      });

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get("content-disposition");
        const filename =
          contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ||
          `producten_export.${format === "csv" ? "csv" : "xlsx"}`;

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      } else {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey) ? prev.filter((col) => col !== columnKey) : [...prev, columnKey],
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map((col) => col.key));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleClose = () => {
    // Reset filters to initial state
    const baseFilters: ExportFilters = { availability: "all" };

    if (currentFilters) {
      setFilters({
        ...baseFilters,
        search: currentFilters.search,
        brand: currentFilters.brand,
        availability:
          currentFilters.availability === "available"
            ? "in_stock"
            : currentFilters.availability === "outOfStock"
              ? "out_of_stock"
              : "all",
      });
    } else {
      setFilters(baseFilters);
    }

    setSelectedColumns([]);
    setFormat("csv");
    setShowSuccess(false);
    setShowTemplates(false);
    onClose();
  };

  const handleLoadTemplate = (template: {
    parameters?: { format?: string; columns?: string[]; filters?: ExportFilters };
  }) => {
    // Load template parameters
    if (template.parameters) {
      const params = template.parameters;
      setFormat((params.format as "csv" | "excel") || "csv");
      setSelectedColumns(params.columns || []);
      setFilters(params.filters || { availability: "all" });
    }
    setShowTemplates(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Producten Exporteren</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900">Export Formaat</h4>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showTemplates ? "Hide Templates" : "Show Templates"}
                </button>
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="csv"
                    checked={format === "csv"}
                    onChange={(e) => setFormat(e.target.value as "csv" | "excel")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span>CSV</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="excel"
                    checked={format === "excel"}
                    onChange={(e) => setFormat(e.target.value as "csv" | "excel")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                  <span>Excel</span>
                </label>
              </div>
            </div>

            {/* Template Manager */}
            {showTemplates && (
              <div className="border-t pt-6">
                <ExportTemplateManager
                  exportType="PRODUCT"
                  exportFormat={format.toUpperCase()}
                  currentParameters={{
                    format,
                    columns: selectedColumns,
                    filters,
                  }}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>
            )}

            {/* Filters */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zoeken</label>
                  <input
                    type="text"
                    placeholder="Product naam, merk, EAN..."
                    value={filters.search || ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merk</label>
                  <input
                    type="text"
                    placeholder="Filter op merk"
                    value={filters.brand || ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschikbaarheid
                  </label>
                  <select
                    value={filters.availability || "all"}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        availability: e.target.value as "in_stock" | "out_of_stock" | "all",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Alle producten</option>
                    <option value="in_stock">Op voorraad</option>
                    <option value="out_of_stock">Niet op voorraad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Prijs</label>
                  <input
                    type="number"
                    placeholder="€"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max. Prijs</label>
                  <input
                    type="number"
                    placeholder="€"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. Sterren
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="1-5"
                    value={filters.minRating || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minRating: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Column Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Columns className="h-5 w-5" />
                  <span>Kolommen Selecteren</span>
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllColumns}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Alles selecteren
                  </button>
                  <button
                    onClick={deselectAllColumns}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Alles deselecteren
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableColumns.map((column) => (
                  <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800">Export succesvol gedownload!</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || selectedColumns.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{exporting ? "Exporteren..." : "Exporteren"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
