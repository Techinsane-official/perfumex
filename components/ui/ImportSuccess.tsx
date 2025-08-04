"use client";

import { CheckCircle, ArrowLeft, RefreshCw, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ImportSuccessProps {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  duplicateRows: number;
  elapsedTime: string;
  onRestart: () => void;
}

export default function ImportSuccess({
  totalRows,
  successfulRows,
  failedRows,
  skippedRows,
  duplicateRows,
  elapsedTime,
  onRestart,
}: ImportSuccessProps) {
  const router = useRouter();

  const successRate = totalRows > 0 ? Math.round((successfulRows / totalRows) * 100) : 0;

  return (
    <div className="bg-white border border-green-200 rounded-lg p-6 space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Succesvol Voltooid!</h3>
        <p className="text-gray-600">De import is succesvol afgerond in {elapsedTime}</p>
      </div>

      {/* Success Rate */}
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 mb-2">{successRate}%</div>
        <div className="text-sm text-gray-600">Succespercentage</div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalRows}</div>
          <div className="text-xs text-gray-600">Totaal</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{successfulRows}</div>
          <div className="text-xs text-gray-600">Geïmporteerd</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{failedRows}</div>
          <div className="text-xs text-gray-600">Gefaald</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{skippedRows}</div>
          <div className="text-xs text-gray-600">Overgeslagen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{duplicateRows}</div>
          <div className="text-xs text-gray-600">Duplicaten</div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            {successfulRows} producten succesvol geïmporteerd
          </span>
        </div>
        {failedRows > 0 && (
          <p className="text-xs text-green-700 mt-1">
            {failedRows} rijen hadden fouten en werden overgeslagen
          </p>
        )}
        {skippedRows > 0 && (
          <p className="text-xs text-green-700 mt-1">
            {skippedRows} rijen werden overgeslagen (duplicaten of instellingen)
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push("/admin/products")}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Bekijk Producten</span>
        </button>

        <button
          onClick={() => router.push("/admin/dashboard")}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Terug naar Dashboard</span>
        </button>

        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Nieuwe Import</span>
        </button>
      </div>

      {/* Additional Info */}
      <div className="text-center text-xs text-gray-500">
        <p>De geïmporteerde producten zijn nu beschikbaar in de productlijst.</p>
        <p>Je kunt de importgeschiedenis bekijken in het admin panel.</p>
      </div>
    </div>
  );
}
