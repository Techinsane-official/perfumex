"use client";

import { useEffect, useState, createContext, useContext } from "react";

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installPrompt: unknown;
  registerServiceWorker: () => Promise<ServiceWorkerRegistration | void>;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  storeOfflineAction: (action: Record<string, unknown>) => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<unknown>(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstallation = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }
    };

    checkInstallation();
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    });
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New service worker available
                if (confirm("Nieuwe versie beschikbaar. Herlaad de pagina om bij te werken?")) {
                  window.location.reload();
                }
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        throw error;
      }
    } else {
      throw new Error("Service Worker not supported");
    }
  };

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  // Send notification
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const notification = new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // Store offline action for background sync
  const storeOfflineAction = (action: Record<string, unknown>) => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "STORE_OFFLINE_ACTION",
        action,
      });
    }
  };

  // Auto-register service worker on mount
  useEffect(() => {
    registerServiceWorker().catch(console.error);
  }, []);

  const value: PWAContextType = {
    isOnline,
    isInstalled,
    canInstall,
    installPrompt,
    registerServiceWorker,
    requestNotificationPermission,
    sendNotification,
    storeOfflineAction,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}
