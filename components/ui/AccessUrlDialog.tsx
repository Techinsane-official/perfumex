"use client";

import { useState } from "react";
import { Copy, ExternalLink, Loader2, CheckCircle, XCircle } from "lucide-react";

interface AccessUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export function AccessUrlDialog({ isOpen, onClose, userId, username }: AccessUrlDialogProps) {
  const [loading, setLoading] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>("");

  const generateAccessUrl = async () => {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch(`/api/admin/users/${userId}/generate-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccessUrl(data.accessUrl);
        setExpiresAt(new Date(data.expiresAt).toLocaleDateString("nl-NL"));
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Er is een fout opgetreden bij het genereren van de toegangs-URL",
        );
      }
    } catch (error) {
      console.error("Error generating access URL:", error);
      setError("Er is een fout opgetreden bij het genereren van de toegangs-URL");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(accessUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleClose = () => {
    setAccessUrl("");
    setExpiresAt("");
    setCopied(false);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Toegangs-URL Genereren</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Gebruiker</p>
            <p className="font-medium text-gray-900">{username}</p>
          </div>

          {/* Generate Button */}
          {!accessUrl && (
            <button
              onClick={generateAccessUrl}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              <span>{loading ? "Genereren..." : "Toegangs-URL Genereren"}</span>
            </button>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Access URL Display */}
          {accessUrl && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Toegangs-URL Gemaakt</span>
                </div>
                <p className="text-xs text-green-700 mb-2">Geldig tot: {expiresAt}</p>
                <div className="bg-white border border-green-300 rounded p-2">
                  <p className="text-xs text-gray-600 break-all">{accessUrl}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copied ? "Gekopieerd!" : "Kopieer URL"}</span>
                </button>
                <button
                  onClick={() => window.open(accessUrl, "_blank")}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-gray-500">
                <p>• Deze URL is 7 dagen geldig</p>
                <p>• Kan slechts één keer gebruikt worden</p>
                <p>• Deel deze URL veilig met de gebruiker</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
