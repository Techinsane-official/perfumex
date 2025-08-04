"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from "lucide-react";

interface ImportResult {
  success: boolean;
  message: string;
  row?: number;
  field?: string;
}

interface BulkImportProps {
  onImportComplete: (results: ImportResult[]) => void;
  templateUrl?: string;
}

export default function BulkImport({ onImportComplete, templateUrl }: BulkImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setIsUploading(true);
    setUploadProgress(0);
    setResults([]);

    try {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!validTypes.includes(file.type)) {
        setResults([
          {
            success: false,
            message: "Ongeldig bestandstype. Alleen CSV en Excel bestanden zijn toegestaan.",
          },
        ]);
        setIsUploading(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload and process
      const response = await fetch("/api/admin/products/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        setUploadProgress(100);
        onImportComplete(data.results || []);
      } else {
        setResults([
          {
            success: false,
            message: data.error || "Upload mislukt. Probeer het opnieuw.",
          },
        ]);
      }
    } catch (error) {
      console.error("Import error:", error);
      setResults([
        {
          success: false,
          message: "Er is een fout opgetreden tijdens het uploaden.",
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const downloadTemplate = () => {
    if (templateUrl) {
      window.open(templateUrl, "_blank");
    }
  };

  const getSuccessCount = () => {
    return results.filter((r) => r.success).length;
  };

  const getErrorCount = () => {
    return results.filter((r) => !r.success).length;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Import</h3>
        <p className="text-sm text-gray-600">
          Upload een CSV of Excel bestand om meerdere producten tegelijk toe te voegen.
        </p>
      </div>

      {/* Template Download */}
      {templateUrl && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                Download het template om de juiste kolommen te gebruiken
              </span>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Template Downloaden</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isUploading
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-4">
          {isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <p className="text-sm text-gray-600">{fileName}</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Sleep een bestand hierheen of klik om te selecteren
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Ondersteunde formaten: CSV, Excel (.xlsx, .xls)
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Bestand Selecteren
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">Import Resultaten</h4>
            <div className="flex items-center space-x-4 text-sm">
              {getSuccessCount() > 0 && (
                <span className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{getSuccessCount()} succesvol</span>
                </span>
              )}
              {getErrorCount() > 0 && (
                <span className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{getErrorCount()} fouten</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        result.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.row && (
                      <p className="text-xs text-gray-600 mt-1">
                        Rij {result.row}
                        {result.field && ` - Veld: ${result.field}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Instructies</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Zorg ervoor dat alle verplichte velden zijn ingevuld</li>
          <li>• EAN codes moeten uniek zijn</li>
          <li>• Prijzen moeten numeriek zijn (gebruik punt als decimaal scheidingsteken)</li>
          <li>• Voorwaarden moeten numeriek zijn</li>
          <li>• Categorieën en subcategorieën moeten bestaan in het systeem</li>
        </ul>
      </div>
    </div>
  );
} 