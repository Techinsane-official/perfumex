"use client";

import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

export interface ValidationSummaryProps {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  duplicateRows: number;
  importOnlyValid: boolean;
  onImportOnlyValidChange: (importOnly: boolean) => void;
}

export default function ValidationSummary({
  totalRows,
  validRows,
  errorRows,
  warningRows,
  duplicateRows,
  importOnlyValid,
  onImportOnlyValidChange,
}: ValidationSummaryProps) {
  const rowsToImport = importOnlyValid ? validRows : totalRows - errorRows;
  const canImport = rowsToImport > 0;

  const getProgressPercentage = () => {
    if (totalRows === 0) return 0;
    return Math.round((validRows / totalRows) * 100);
  };

  const getStatusColor = () => {
    if (errorRows > 0) return "red";
    if (warningRows > 0 || duplicateRows > 0) return "yellow";
    return "green";
  };

  const getStatusMessage = () => {
    if (errorRows > 0) {
      return `${errorRows} fouten gevonden - Import niet mogelijk`;
    }
    if (warningRows > 0 || duplicateRows > 0) {
      return `${warningRows} waarschuwingen, ${duplicateRows} duplicaten - Import mogelijk`;
    }
    return "Alle data geldig - Klaar voor import";
  };

  const statusColor = getStatusColor();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Validatie Overzicht</h3>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColor === "red"
              ? "bg-red-100 text-red-800"
              : statusColor === "yellow"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
          }`}
        >
          {getStatusMessage()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Geldigheid</span>
          <span className="text-gray-900 font-medium">{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              statusColor === "red"
                ? "bg-red-600"
                : statusColor === "yellow"
                  ? "bg-yellow-600"
                  : "bg-green-600"
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalRows}</div>
          <div className="text-xs text-gray-600">Totaal</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{validRows}</div>
          <div className="text-xs text-gray-600">Geldig</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{errorRows}</div>
          <div className="text-xs text-gray-600">Fouten</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{warningRows}</div>
          <div className="text-xs text-gray-600">Waarschuwingen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{duplicateRows}</div>
          <div className="text-xs text-gray-600">Duplicaten</div>
        </div>
      </div>

      {/* Import Settings */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Import Instellingen</div>
              <div className="text-xs text-gray-600">
                {importOnlyValid
                  ? `Alleen ${validRows} geldige rijen worden geïmporteerd`
                  : `${rowsToImport} rijen worden geïmporteerd (exclusief fouten)`}
              </div>
            </div>
          </div>

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

      {/* Warnings */}
      {errorRows > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Import geblokkeerd door {errorRows} fout(en)
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Los de fouten op voordat je de import kunt starten.
          </p>
        </div>
      )}

      {warningRows > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {warningRows} waarschuwing(en) gevonden
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            De import kan doorgaan, maar controleer de waarschuwingen.
          </p>
        </div>
      )}

      {duplicateRows > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              {duplicateRows} duplicaat(en) gevonden
            </span>
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Duplicaten worden behandeld volgens je duplicate detectie instellingen.
          </p>
        </div>
      )}

      {/* Import Status */}
      <div
        className={`border rounded-md p-4 ${
          canImport ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center space-x-2">
          {canImport ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${canImport ? "text-green-800" : "text-red-800"}`}>
            {canImport
              ? `Klaar voor import: ${rowsToImport} rijen`
              : "Import niet mogelijk - Los fouten op"}
          </span>
        </div>
      </div>
    </div>
  );
}
