"use client";

import { useState } from "react";
import { Upload, Download, AlertCircle } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: Record<string, unknown>;
  }>;
}

export default function CustomerImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      } else {
        alert("Alleen CSV bestanden zijn toegestaan");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
      } else {
        alert("Alleen CSV bestanden zijn toegestaan");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/customers/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result.results);
      } else {
        alert(`Fout: ${result.error}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Er is een fout opgetreden bij het uploaden van het bestand.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        name: "Voorbeeld Klant BV",
        email: "info@voorbeeldklant.nl",
        phone: "0201234567",
        address: "Voorbeeldstraat 123, 1000 AA Amsterdam",
        generalMargin: "15",
        minimumOrderValue: "100",
        minimumOrderItems: "5",
        status: "Actief",
      },
    ];

    const csvContent =
      "name,email,phone,address,generalMargin,minimumOrderValue,minimumOrderItems,status\n" +
      sampleData
        .map(
          (row) =>
            `"${row.name}","${row.email}","${row.phone}","${row.address}","${row.generalMargin}","${row.minimumOrderValue}","${row.minimumOrderItems}","${row.status}"`,
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "klanten_import_voorbeeld.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/admin/customers" />

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Klanten Importeren</h1>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Import Instructies</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload een CSV bestand met klantgegevens</li>
              <li>• Email adressen moeten uniek zijn</li>
              <li>• Algemene marge moet tussen 0 en 100% liggen</li>
              <li>• Status moet &apos;Actief&apos; of &apos;Inactief&apos; zijn</li>
              <li>• Download het voorbeeldbestand voor de juiste kolommen</li>
            </ul>
          </div>

          {/* Sample Download */}
          <div className="mb-6">
            <button
              onClick={downloadSampleCSV}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Download voorbeeld CSV bestand</span>
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Bestand Uploaden
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Sleep een CSV bestand hierheen of klik om te selecteren
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Bestand Selecteren
              </label>
              {file && <p className="mt-2 text-sm text-green-600">Geselecteerd: {file.name}</p>}
            </div>
          </div>

          {/* Upload Button */}
          {file && (
            <div className="mb-6">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Importeren...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Start Import</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Import Resultaat</h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                  <div className="text-sm text-gray-600">Totaal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                  <div className="text-sm text-gray-600">Succesvol</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-gray-600">Gefaald</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fouten:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">
                              Rij {error.row}: {error.error}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Data: {JSON.stringify(error.data)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
