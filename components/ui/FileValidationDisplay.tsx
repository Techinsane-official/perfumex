"use client";

import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { FileValidationResult, ColumnValidationResult } from "@/lib/validation/fileValidation";

interface FileValidationDisplayProps {
  fileValidation?: FileValidationResult | null;
  columnValidation?: ColumnValidationResult | null;
  dataValidation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validRows: number;
    invalidRows: number;
  } | null;
  isLoading?: boolean;
}

export default function FileValidationDisplay({
  fileValidation,
  columnValidation,
  dataValidation,
  isLoading = false,
}: FileValidationDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-800">Bestand wordt geanalyseerd...</span>
        </div>
      </div>
    );
  }

  if (!fileValidation && !columnValidation && !dataValidation) {
    return null;
  }

  const allErrors = [
    ...(fileValidation?.errors || []),
    ...(columnValidation?.errors || []),
    ...(dataValidation?.errors || []),
  ];

  const allWarnings = [
    ...(fileValidation?.warnings || []),
    ...(columnValidation?.warnings || []),
    ...(dataValidation?.warnings || []),
  ];

  const isValid =
    !fileValidation?.errors.length &&
    !columnValidation?.errors.length &&
    !dataValidation?.errors.length;

  return (
    <div className="space-y-4">
      {/* File Info */}
      {fileValidation?.fileInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Bestand Informatie</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Naam:</span>
              <span className="ml-2 font-medium">{fileValidation.fileInfo.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Grootte:</span>
              <span className="ml-2 font-medium">
                {(fileValidation.fileInfo.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div>
              <span className="text-gray-600">Type:</span>
              <span className="ml-2 font-medium">
                {fileValidation.fileInfo.extension.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping */}
      {columnValidation?.columnMapping && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Kolom Mapping</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(columnValidation.columnMapping).map(([expected, actual]) => (
              <div key={expected}>
                <span className="text-gray-600">{expected}:</span>
                <span className="ml-2 font-medium">{actual}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Statistics */}
      {dataValidation && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Data Statistieken</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Geldige rijen:</span>
              <span className="ml-2 font-medium text-green-600">{dataValidation.validRows}</span>
            </div>
            <div>
              <span className="text-gray-600">Ongeldige rijen:</span>
              <span className="ml-2 font-medium text-red-600">{dataValidation.invalidRows}</span>
            </div>
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div
        className={`border rounded-lg p-4 ${
          isValid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`font-medium ${isValid ? "text-green-800" : "text-red-800"}`}>
            {isValid ? "Bestand is geldig" : "Bestand bevat fouten"}
          </span>
        </div>
      </div>

      {/* Errors */}
      {allErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-800">Fouten ({allErrors.length})</h4>
          </div>
          <ul className="space-y-1">
            {allErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                <span className="text-red-500">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {allWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-800">
              Waarschuwingen ({allWarnings.length})
            </h4>
          </div>
          <ul className="space-y-1">
            {allWarnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start space-x-2">
                <span className="text-yellow-500">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Columns */}
      {columnValidation?.missingColumns && columnValidation.missingColumns.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4 text-orange-600" />
            <h4 className="text-sm font-medium text-orange-800">Ontbrekende Kolommen</h4>
          </div>
          <ul className="space-y-1">
            {columnValidation.missingColumns.map((column, index) => (
              <li key={index} className="text-sm text-orange-700 flex items-start space-x-2">
                <span className="text-orange-500">•</span>
                <span>{column}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extra Columns */}
      {columnValidation?.extraColumns && columnValidation.extraColumns.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-800">Extra Kolommen</h4>
          </div>
          <ul className="space-y-1">
            {columnValidation.extraColumns.map((column, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>{column}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
