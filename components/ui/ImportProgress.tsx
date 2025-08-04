"use client";

import { useState, useEffect } from "react";
import { XCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ImportProgressData {
  status: "idle" | "loading" | "completed" | "error" | "cancelled";
  progress: number; // 0-100
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  currentBatch: number;
  totalBatches: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: Record<string, unknown>;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  duplicates: Array<{
    row: number;
    field: string;
    message: string;
    data: Record<string, unknown>;
  }>;
  startTime?: Date;
  endTime?: Date;
}

export interface ImportProgressProps {
  progress: ImportProgressData;
  onCancel?: () => void;
  onRetry?: () => void;
  onClose?: () => void;
  onComplete?: (progress: ImportProgressData) => void;
}

export default function ImportProgress({
  progress,
  onCancel,
  onRetry,
  onClose,
  onComplete,
}: ImportProgressProps) {
  const [elapsedTime, setElapsedTime] = useState<string>("");
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Calculate elapsed time
  useEffect(() => {
    if (!progress.startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - progress.startTime!.getTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.startTime]);

  // Call onComplete when import is finished
  useEffect(() => {
    if (
      onComplete &&
      (progress.status === "completed" ||
        progress.status === "error" ||
        progress.status === "cancelled")
    ) {
      onComplete(progress);
    }
  }, [progress.status, progress, onComplete]);

  // Calculate progress percentage
  const progressPercentage =
    progress.totalRows > 0 ? Math.round((progress.processedRows / progress.totalRows) * 100) : 0;

  // Get status color and icon
  const getStatusInfo = () => {
    switch (progress.status) {
      case "loading":
        return {
          color: "blue",
          icon: (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ),
        };
      case "completed":
        return { color: "green", icon: <CheckCircle className="h-4 w-4 text-green-600" /> };
      case "error":
        return { color: "red", icon: <XCircle className="h-4 w-4 text-red-600" /> };
      case "cancelled":
        return { color: "gray", icon: <XCircle className="h-4 w-4 text-gray-600" /> };
      default:
        return { color: "gray", icon: <Info className="h-4 w-4 text-gray-600" /> };
    }
  };

  const statusInfo = getStatusInfo();

  // Get status message
  const getStatusMessage = () => {
    switch (progress.status) {
      case "loading":
        return `Import bezig... (${progress.processedRows}/${progress.totalRows})`;
      case "completed":
        return `Import voltooid! ${progress.successfulRows} producten geïmporteerd`;
      case "error":
        return `Import gestopt met fouten. ${progress.failedRows} rijen gefaald`;
      case "cancelled":
        return "Import geannuleerd";
      default:
        return "Klaar voor import";
    }
  };

  // Calculate estimated time remaining
  const getEstimatedTime = () => {
    if (progress.status !== "loading" || progress.processedRows === 0) return null;

    const elapsed = new Date().getTime() - progress.startTime!.getTime();
    const rate = progress.processedRows / elapsed; // rows per millisecond
    const remaining = (progress.totalRows - progress.processedRows) / rate;

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {statusInfo.icon}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Product Import</h3>
            <p className="text-sm text-gray-600">{getStatusMessage()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {progress.status === "loading" && onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Annuleren
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Voortgang</span>
          <span className="text-gray-900 font-medium">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.status === "completed"
                ? "bg-green-600"
                : progress.status === "error"
                  ? "bg-red-600"
                  : progress.status === "cancelled"
                    ? "bg-gray-600"
                    : "bg-blue-600"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{progress.totalRows}</div>
          <div className="text-xs text-gray-600">Totaal</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{progress.successfulRows}</div>
          <div className="text-xs text-gray-600">Succesvol</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{progress.failedRows}</div>
          <div className="text-xs text-gray-600">Gefaald</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{progress.skippedRows}</div>
          <div className="text-xs text-gray-600">Overgeslagen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{progress.processedRows}</div>
          <div className="text-xs text-gray-600">Verwerkt</div>
        </div>
      </div>

      {/* Batch Progress */}
      {progress.status === "loading" && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              Batch {progress.currentBatch} van {progress.totalBatches}
            </span>
            <span className="text-blue-600 font-medium">
              {elapsedTime} {getEstimatedTime() && `(~${getEstimatedTime()} resterend)`}
            </span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {progress.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Waarschuwingen ({progress.warnings.length})
            </span>
          </div>
          <div className="space-y-1">
            {progress.warnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="text-xs text-yellow-700">
                Rij {warning.row}: {warning.message}
              </div>
            ))}
            {progress.warnings.length > 3 && (
              <div className="text-xs text-yellow-600">
                +{progress.warnings.length - 3} meer waarschuwingen
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicates */}
      {progress.duplicates.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Duplicaten ({progress.duplicates.length})
            </span>
          </div>
          <div className="space-y-1">
            {progress.duplicates.slice(0, 3).map((duplicate, index) => (
              <div key={index} className="text-xs text-purple-700">
                Rij {duplicate.row}: {duplicate.message}
              </div>
            ))}
            {progress.duplicates.length > 3 && (
              <div className="text-xs text-purple-600">
                +{progress.duplicates.length - 3} meer duplicaten
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {progress.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Fouten ({progress.errors.length})
              </span>
            </div>
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              {showErrorDetails ? "Verberg details" : "Toon details"}
            </button>
          </div>

          {showErrorDetails && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {progress.errors.map((error, index) => (
                <div key={index} className="text-xs bg-red-100 border border-red-200 rounded p-2">
                  <div className="font-medium text-red-800">
                    Rij {error.row} - {error.field}
                  </div>
                  <div className="text-red-700">{error.message}</div>
                  <div className="text-red-600 text-xs mt-1">
                    Data: {JSON.stringify(error.data)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {progress.status === "completed" && onRetry && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Opnieuw Proberen
          </button>
        </div>
      )}

      {progress.status === "error" && onRetry && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Opnieuw Proberen
          </button>
        </div>
      )}
    </div>
  );
}
