"use client";

import { usePWA } from "./PWAProvider";
import { WifiOff, AlertTriangle } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 z-50">
      <div className="flex items-center justify-center space-x-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Je bent offline. Sommige functies zijn mogelijk niet beschikbaar.</span>
      </div>
    </div>
  );
}

export function OfflineStatusBar() {
  const { isOnline } = usePWA();

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-1 z-50 transition-colors duration-300 ${
        isOnline ? "bg-green-500" : "bg-yellow-500"
      }`}
    />
  );
}

export function OfflineAlert() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Offline modus</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Je bent momenteel offline. Sommige functies zijn mogelijk beperkt. Controleer je
            internetverbinding.
          </p>
        </div>
      </div>
    </div>
  );
}
