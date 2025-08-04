"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Eye, EyeOff } from "lucide-react";

export interface ValidationRow {
  row: number;
  data: Record<string, unknown>;
  status: "valid" | "warning" | "error";
  errors?: string[];
  warnings?: string[];
  isDuplicate?: boolean;
}

export interface ImportPreviewTableProps {
  data: ValidationRow[];
  columnMapping: Record<string, string>;
  showOnlyIssues: boolean;
  onShowOnlyIssuesChange: (show: boolean) => void;
  importOnlyValid: boolean;
  onImportOnlyValidChange: (importOnly: boolean) => void;
}

export default function ImportPreviewTable({
  data,
  columnMapping,
  showOnlyIssues,
  onShowOnlyIssuesChange,
  importOnlyValid,
  onImportOnlyValidChange,
}: ImportPreviewTableProps) {
  const [showAllRows, setShowAllRows] = useState(false);

  // Filter data based on settings
  const filteredData = showOnlyIssues ? data.filter((row) => row.status !== "valid") : data;

  const displayData = showAllRows ? filteredData : filteredData.slice(0, 10);

  // Get column headers from mapping
  const headers = Object.values(columnMapping).filter(Boolean);

  const getStatusIcon = (status: ValidationRow["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getRowClass = (row: ValidationRow) => {
    if (row.isDuplicate) {
      return "bg-purple-50 border-l-4 border-purple-400";
    }
    switch (row.status) {
      case "error":
        return "bg-red-50 border-l-4 border-red-400";
      case "warning":
        return "bg-yellow-50 border-l-4 border-yellow-400";
      default:
        return "bg-white";
    }
  };

  const getStatusText = (row: ValidationRow) => {
    if (row.isDuplicate) return "Duplicaat";
    switch (row.status) {
      case "valid":
        return "Geldig";
      case "warning":
        return "Waarschuwing";
      case "error":
        return "Fout";
      default:
        return "Onbekend";
    }
  };

  const validRows = data.filter((row) => row.status === "valid").length;
  const errorRows = data.filter((row) => row.status === "error").length;
  const warningRows = data.filter((row) => row.status === "warning").length;
  const duplicateRows = data.filter((row) => row.isDuplicate).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
          <p className="text-sm text-gray-600">
            Toont {displayData.length} van {filteredData.length} rijen
            {showOnlyIssues && " (alleen met problemen)"}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Show only issues toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlyIssues}
              onChange={(e) => onShowOnlyIssuesChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Alleen problemen</span>
          </label>

          {/* Import only valid toggle */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={importOnlyValid}
              onChange={(e) => onImportOnlyValidChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Alleen geldige rijen</span>
          </label>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-lg font-bold text-green-800">{validRows}</div>
              <div className="text-xs text-green-600">Geldig</div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <div>
              <div className="text-lg font-bold text-red-800">{errorRows}</div>
              <div className="text-xs text-red-600">Fouten</div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div>
              <div className="text-lg font-bold text-yellow-800">{warningRows}</div>
              <div className="text-xs text-yellow-600">Waarschuwingen</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-lg font-bold text-purple-800">{duplicateRows}</div>
              <div className="text-xs text-purple-600">Duplicaten</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rij
              </th>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, index) => (
              <tr key={index} className={getRowClass(row)}>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(row.status)}
                    <span className="text-xs font-medium text-gray-900">{getStatusText(row)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{row.row}</td>
                {headers.map((header, headerIndex) => (
                  <td
                    key={headerIndex}
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                  >
                    <div className="max-w-xs truncate" title={String(row.data[header] || "")}>
                      {String(row.data[header] || "")}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more/less toggle */}
      {filteredData.length > 10 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {showAllRows ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Toon minder rijen</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Toon alle {filteredData.length} rijen</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error/Warning Details */}
      {displayData.some((row) => row.errors?.length || row.warnings?.length) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Details per rij:</h4>
          {displayData.map((row, index) => (
            <div key={index} className="text-xs">
              {row.errors?.length && (
                <div className="mb-1">
                  <span className="font-medium text-red-700">Rij {row.row} - Fouten:</span>
                  <ul className="ml-4 text-red-600">
                    {row.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {row.warnings?.length && (
                <div>
                  <span className="font-medium text-yellow-700">
                    Rij {row.row} - Waarschuwingen:
                  </span>
                  <ul className="ml-4 text-yellow-600">
                    {row.warnings.map((warning, warningIndex) => (
                      <li key={warningIndex}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
