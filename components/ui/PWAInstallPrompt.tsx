"use client";

import { useState, useEffect } from "react";
import { usePWA } from "./PWAProvider";
import { Download, X, Smartphone } from "lucide-react";

export function PWAInstallPrompt() {
  const { canInstall, installPrompt, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Show prompt if app can be installed and is not already installed
    if (canInstall && !isInstalled) {
      setShowPrompt(true);
    }
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    if (!installPrompt) return;

    setIsInstalling(true);
    try {
      const result = await installPrompt.prompt();
      console.log("Install prompt result:", result);

      if (result.outcome === "accepted") {
        console.log("App installed successfully");
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Install failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">Installeer Project X</h3>
          <p className="text-sm text-gray-500 mt-1">
            Voeg toe aan je startscherm voor snelle toegang
          </p>
        </div>

        <button onClick={handleDismiss} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex space-x-2">
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isInstalling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Installeren...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Installeren</span>
            </>
          )}
        </button>

        <button
          onClick={handleDismiss}
          className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200"
        >
          Later
        </button>
      </div>
    </div>
  );
}
