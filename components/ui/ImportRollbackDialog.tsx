"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, XCircle, Loader2, Info } from "lucide-react";

export interface RollbackPreview {
  totalProducts: number;
  productsToRollback: number;
  estimatedImpact: string;
  warnings: string[];
}

export interface RollbackResult {
  success: boolean;
  message: string;
  rolledBackProducts: number;
  errors: string[];
}

interface ImportRollbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  importId: string;
  importName: string;
}

type RollbackStep = "preview" | "confirm" | "executing" | "complete";

export default function ImportRollbackDialog({
  isOpen,
  onClose,
  importId,
  importName,
}: ImportRollbackDialogProps) {
  const [step, setStep] = useState<RollbackStep>("preview");
  const [preview, setPreview] = useState<RollbackPreview | null>(null);
  const [result, setResult] = useState<RollbackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");

  const fetchImportDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/import/${importId}`);
      if (response.ok) {
        const data = await response.json();

        // Create preview from import data
        const preview: RollbackPreview = {
          totalProducts: data.totalRows,
          productsToRollback: data.importedRows,
          estimatedImpact: `${data.importedRows} producten zullen worden verwijderd`,
          warnings: data.hasRollback ? ["Deze import is al eerder teruggedraaid"] : [],
        };

        setPreview(preview);
      } else {
        console.error("Failed to fetch import details");
      }
    } catch (error) {
      console.error("Error fetching import details:", error);
    } finally {
      setLoading(false);
    }
  }, [importId]);

  useEffect(() => {
    if (isOpen && step === "preview") {
      fetchImportDetails();
    }
  }, [isOpen, step, fetchImportDetails]);

  const executeRollback = async () => {
    try {
      setStep("executing");
      setLoading(true);

      const response = await fetch("/api/import/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          importId,
          rollbackReason: rollbackReason || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          success: true,
          message: data.message,
          rolledBackProducts: data.rollback.entitiesRestored,
          errors: [],
        });
        setStep("complete");
      } else {
        const errorData = await response.json();
        setResult({
          success: false,
          message: errorData.error || "Rollback failed",
          rolledBackProducts: 0,
          errors: [errorData.error || "Unknown error"],
        });
        setStep("complete");
      }
    } catch {
      setResult({
        success: false,
        message: "Rollback failed due to network error",
        rolledBackProducts: 0,
        errors: ["Network error occurred"],
      });
      setStep("complete");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("preview");
    setPreview(null);
    setResult(null);
    setConfirmRollback(false);
    setRollbackReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Import Rollback</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex space-x-2">
            {(["preview", "confirm", "executing", "complete"] as RollbackStep[]).map(
              (stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === stepName
                        ? "bg-blue-600 text-white"
                        : step === "complete" ||
                            ["preview", "confirm", "executing"].indexOf(step) > index
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step === "complete" && stepName === "complete" ? "✓" : index + 1}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step === "complete" ||
                        ["preview", "confirm", "executing"].indexOf(step) > index
                          ? "bg-green-600"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Content based on step */}
        {step === "preview" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Rollback Preview</h4>
              <p className="text-gray-600">
                Bekijk wat er zal gebeuren bij het terugdraaien van import:{" "}
                <strong>{importName}</strong>
              </p>
            </div>

            {/* Preview Results */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Totaal producten:</span>
                      <span className="ml-2 font-medium">{preview.totalProducts}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Te rollbacken:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {preview.productsToRollback}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Geschatte impact:</span>
                    <span className="ml-2 font-medium">{preview.estimatedImpact}</span>
                  </div>
                </div>

                {preview.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Waarschuwingen</span>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {preview.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Kon geen preview laden</div>
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
                onClick={() => setStep("confirm")}
                disabled={!preview || preview.productsToRollback === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Doorgaan
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Bevestig Rollback</h4>
              <p className="text-gray-600">
                Je staat op het punt om{" "}
                <strong>{preview?.productsToRollback || 0} producten</strong> terug te draaien. Deze
                actie kan niet ongedaan worden gemaakt.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Let op!</span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Deze actie is permanent en kan niet ongedaan worden gemaakt</li>
                <li>• Alle producten uit deze import zullen worden verwijderd</li>
                <li>• Zorg ervoor dat je een backup hebt voordat je doorgaat</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="rollbackReason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reden voor rollback (optioneel)
                </label>
                <textarea
                  id="rollbackReason"
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="Vul een reden in voor deze rollback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirmRollback"
                  checked={confirmRollback}
                  onChange={(e) => setConfirmRollback(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="confirmRollback" className="text-sm text-gray-700">
                  Ik begrijp de gevolgen en wil doorgaan met de rollback
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStep("preview")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Terug
              </button>
              <button
                onClick={executeRollback}
                disabled={!confirmRollback}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rollback Uitvoeren
              </button>
            </div>
          </div>
        )}

        {step === "executing" && (
          <div className="space-y-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Rollback Uitvoeren</h4>
              <p className="text-gray-600">Rollback wordt uitgevoerd... Dit kan even duren.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  {preview?.productsToRollback || 0} producten worden teruggedraaid
                </span>
              </div>
            </div>
          </div>
        )}

        {step === "complete" && result && (
          <div className="space-y-6">
            {/* Success/Failure Header */}
            <div className="text-center">
              {result.success ? (
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              )}

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {result.success ? "Rollback Succesvol" : "Rollback Gefaald"}
              </h4>
              <p className="text-gray-600">{result.message}</p>
            </div>

            {/* Results Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.rolledBackProducts}
                  </div>
                  <div className="text-xs text-gray-600">Teruggedraaide producten</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.errors.length}</div>
                  <div className="text-xs text-gray-600">Fouten</div>
                </div>
              </div>
            </div>

            {/* Errors Display */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Fouten</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
