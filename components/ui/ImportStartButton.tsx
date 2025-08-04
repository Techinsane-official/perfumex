"use client";

import { useState } from "react";
import { Play, AlertTriangle, XCircle } from "lucide-react";

export interface ImportStartButtonProps {
  canImport: boolean;
  rowsToImport: number;
  totalRows: number;
  errorRows: number;
  warningRows: number;
  duplicateRows: number;
  importOnlyValid: boolean;
  duplicateConfig: {
    strategy: "skip" | "overwrite" | "flag" | "error";
    checkEAN: boolean;
    checkNameBrand: boolean;
  };
  onStartImport: () => void;
  isImporting: boolean;
}

export default function ImportStartButton({
  canImport,
  rowsToImport,
  totalRows,
  errorRows,
  warningRows,
  duplicateRows,
  importOnlyValid,
  duplicateConfig,
  onStartImport,
  isImporting,
}: ImportStartButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const getStrategyText = () => {
    switch (duplicateConfig.strategy) {
      case "skip":
        return "Duplicaten worden overgeslagen";
      case "overwrite":
        return "Duplicaten worden overschreven";
      case "flag":
        return "Duplicaten worden gemarkeerd als fouten";
      case "error":
        return "Import stopt bij duplicaten";
      default:
        return "";
    }
  };

  const getWarningMessage = () => {
    const warnings = [];

    if (duplicateConfig.strategy === "overwrite") {
      warnings.push("⚠️ Bestaande producten worden overschreven");
    }

    if (duplicateConfig.strategy === "error" && duplicateRows > 0) {
      warnings.push("⚠️ Import stopt bij de eerste duplicaat");
    }

    if (warningRows > 0) {
      warnings.push(`⚠️ ${warningRows} waarschuwing(en) gevonden`);
    }

    return warnings;
  };

  const handleStartImport = () => {
    if (!canImport) return;
    setShowConfirmation(true);
  };

  const handleConfirmImport = () => {
    setShowConfirmation(false);
    onStartImport();
  };

  const handleCancelImport = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Import Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartImport}
          disabled={!canImport || isImporting}
          className={`px-8 py-4 rounded-lg font-semibold text-lg flex items-center space-x-3 transition-all duration-200 ${
            canImport && !isImporting
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Import bezig...</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              <span>Start Import</span>
            </>
          )}
        </button>
      </div>

      {/* Import Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">
            {importOnlyValid
              ? `Alleen geldige rijen worden geïmporteerd`
              : `Alle rijen worden geïmporteerd (exclusief fouten)`}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {rowsToImport} van {totalRows} rijen
          </div>
          <div className="text-xs text-gray-500">
            {errorRows > 0 && `${errorRows} fouten, `}
            {warningRows > 0 && `${warningRows} waarschuwingen, `}
            {duplicateRows > 0 && `${duplicateRows} duplicaten`}
          </div>
        </div>
      </div>

      {/* Duplicate Strategy Info */}
      {duplicateRows > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Duplicate Strategie</span>
          </div>
          <p className="text-sm text-blue-700">{getStrategyText()}</p>
        </div>
      )}

      {/* Warnings */}
      {getWarningMessage().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="space-y-2">
            {getWarningMessage().map((warning, index) => (
              <div key={index} className="text-sm text-yellow-800">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Import Bevestigen</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                Je staat op het punt om <strong>{rowsToImport} rijen</strong> te importeren.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Totaal: {totalRows} rijen</div>
                  <div>• Te importeren: {rowsToImport} rijen</div>
                  {errorRows > 0 && <div>• Fouten: {errorRows} rijen</div>}
                  {warningRows > 0 && <div>• Waarschuwingen: {warningRows} rijen</div>}
                  {duplicateRows > 0 && <div>• Duplicaten: {duplicateRows} rijen</div>}
                </div>
              </div>

              {duplicateConfig.strategy === "overwrite" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Let op: Bestaande producten worden overschreven
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelImport}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Import Starten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Status */}
      {!canImport && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Import niet mogelijk</span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Los eerst de fouten op voordat je de import kunt starten.
          </p>
        </div>
      )}
    </div>
  );
}
