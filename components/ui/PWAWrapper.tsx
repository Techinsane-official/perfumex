"use client";

import { ErrorBoundary } from "./ErrorBoundary";
import { PWAProvider } from "./PWAProvider";
import { OfflineStatusBar } from "./OfflineIndicator";

interface PWAWrapperProps {
  children: React.ReactNode;
}

export function PWAWrapper({ children }: PWAWrapperProps) {
  return (
    <ErrorBoundary fallback={<div>PWA features unavailable</div>}>
      <PWAProvider>
        <OfflineStatusBar />
        {children}
      </PWAProvider>
    </ErrorBoundary>
  );
} 