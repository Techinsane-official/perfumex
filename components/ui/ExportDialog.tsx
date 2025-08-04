"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileCsv, X, Check } from "lucide-react";

interface ExportOptions {
  format: "pdf" | "excel" | "csv";
  columns: string[];
  filters: Record<string, any>;
  includeImages: boolean;
  includePricing: boolean;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  availableColumns: string[];
  currentFilters: Record<string, any>;
  exportType: "products" | "orders" | "customers";
}

export default function ExportDialog({
  isOpen,
  onClose,
  onExport,
  availableColumns,
  currentFilters,
  exportType,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "excel" | "csv">("excel");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(availableColumns);
  const [includeImages, setIncludeImages] = useState(false);
  const [includePricing, setIncludePricing] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      id: "excel",
      name: "Excel (.xlsx)",
      icon: FileSpreadsheet,
      description: "Best for data analysis and editing",
    },
    {
      id: "csv",
      name: "CSV (.csv)",
      icon: FileCsv,
      description: "Universal format, compatible with all systems",
    },
    {
      id: "pdf",
      name: "PDF (.pdf)",
      icon: FileText,
      description: "Best for printing and sharing",
    },
  ];

  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(availableColumns);
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }

    setIsExporting(true);
    try {
      await onExport({
        format: selectedFormat,
        columns: selectedColumns,
        filters: currentFilters,
        includeImages,
        includePricing,
      });
      onClose();
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Export {exportType.charAt(0).toUpperCase() + exportType.slice(1)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose format and columns for your export
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id as any)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedFormat === format.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">{format.name}</div>
                        <div className="text-sm text-gray-600">{format.description}</div>
                      </div>
                      {selectedFormat === format.id && (
                        <Check className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Columns to Export</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllColumns}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllColumns}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {availableColumns.map((column) => (
                <label
                  key={column}
                  className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {column.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Options</h3>
            <div className="space-y-3">
              {exportType === "products" && (
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include product images</span>
                </label>
              )}
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includePricing}
                  onChange={(e) => setIncludePricing(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include pricing information</span>
              </label>
            </div>
          </div>

          {/* Active Filters */}
          {Object.keys(currentFilters).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Filters</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  The following filters will be applied to your export:
                </p>
                <div className="space-y-1">
                  {Object.entries(currentFilters).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700">{key}:</span>{" "}
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedColumns.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 