"use client";

import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

export type DuplicateStrategy = "skip" | "overwrite" | "flag" | "error";

export interface DuplicateDetectionConfig {
  strategy: DuplicateStrategy;
  checkEAN: boolean;
  checkNameBrand: boolean;
}

export interface DuplicateDetectionConfigProps {
  config: DuplicateDetectionConfig;
  onConfigChange: (config: DuplicateDetectionConfig) => void;
  duplicateCount?: number;
}

export default function DuplicateDetectionConfig({
  config,
  onConfigChange,
  duplicateCount = 0,
}: DuplicateDetectionConfigProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStrategyChange = (strategy: DuplicateStrategy) => {
    onConfigChange({
      ...config,
      strategy,
    });
  };

  const handleCheckboxChange = (field: keyof DuplicateDetectionConfig, value: boolean) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const getStrategyDescription = (strategy: DuplicateStrategy) => {
    switch (strategy) {
      case "skip":
        return "Sla bestaande producten over en ga door met de import";
      case "overwrite":
        return "Vervang bestaande producten met nieuwe data";
      case "flag":
        return "Markeer duplicaten als fouten maar ga door met de import";
      case "error":
        return "Stop de import bij de eerste duplicaat";
      default:
        return "";
    }
  };

  const getStrategyWarning = (strategy: DuplicateStrategy) => {
    switch (strategy) {
      case "overwrite":
        return "⚠️ Let op: Bestaande productgegevens worden overschreven";
      case "error":
        return "⚠️ Let op: Import stopt bij de eerste duplicaat";
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Duplicate Detectie</h3>
        <p className="text-sm text-gray-600">
          Kies hoe duplicaten moeten worden behandeld tijdens de import.
        </p>
        {duplicateCount > 0 && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {duplicateCount} potentiële duplicaten gedetecteerd
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Strategy Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Duplicaat Strategie</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(["skip", "overwrite", "flag", "error"] as DuplicateStrategy[]).map((strategy) => (
            <div key={strategy} className="relative">
              <input
                type="radio"
                id={`strategy-${strategy}`}
                name="duplicate-strategy"
                value={strategy}
                checked={config.strategy === strategy}
                onChange={() => handleStrategyChange(strategy)}
                className="sr-only"
              />
              <label
                htmlFor={`strategy-${strategy}`}
                className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                  config.strategy === strategy
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {strategy === "skip" && "Overslaan"}
                      {strategy === "overwrite" && "Overschrijven"}
                      {strategy === "flag" && "Markeren"}
                      {strategy === "error" && "Fout"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getStrategyDescription(strategy)}
                    </div>
                  </div>
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                    {config.strategy === strategy && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Strategy Warning */}
        {getStrategyWarning(config.strategy) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">{getStrategyWarning(config.strategy)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <div className="border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? "Verberg" : "Toon"} geavanceerde opties
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="check-ean"
                checked={config.checkEAN}
                onChange={(e) => handleCheckboxChange("checkEAN", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="check-ean" className="text-sm text-gray-700">
                Controleer EAN codes voor duplicaten
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="check-name-brand"
                checked={config.checkNameBrand}
                onChange={(e) => handleCheckboxChange("checkNameBrand", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="check-name-brand" className="text-sm text-gray-700">
                Controleer naam + merk combinatie voor duplicaten
              </label>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <div className="text-xs text-gray-600">
                <p>
                  <strong>EAN controle:</strong> Detecteert producten met dezelfde EAN code
                </p>
                <p>
                  <strong>Naam + merk:</strong> Detecteert producten met dezelfde naam en merk
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="text-sm text-gray-700">
          <p>
            <strong>Huidige instelling:</strong>
          </p>
          <p>
            • Strategie:{" "}
            <span className="font-medium capitalize">
              {config.strategy === "skip" && "Overslaan"}
              {config.strategy === "overwrite" && "Overschrijven"}
              {config.strategy === "flag" && "Markeren"}
              {config.strategy === "error" && "Fout"}
            </span>
          </p>
          <p>
            • EAN controle: <span className="font-medium">{config.checkEAN ? "Aan" : "Uit"}</span>
          </p>
          <p>
            • Naam + merk controle:{" "}
            <span className="font-medium">{config.checkNameBrand ? "Aan" : "Uit"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
