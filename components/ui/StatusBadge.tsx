import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error";
  className?: string;
}

/**
 * Reusable StatusBadge component with status variants and icons
 * @param status - Status type with corresponding styling
 * @param className - Additional CSS classes
 */
export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      label: "Actief",
      icon: "🟢",
      classes: "bg-green-100 text-green-800",
    },
    inactive: {
      label: "Inactief",
      icon: "⚪",
      classes: "bg-gray-100 text-gray-800",
    },
    pending: {
      label: "In behandeling",
      icon: "🟡",
      classes: "bg-yellow-100 text-yellow-800",
    },
    error: {
      label: "Fout",
      icon: "🔴",
      classes: "bg-red-100 text-red-800",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.classes,
        className,
      )}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}
