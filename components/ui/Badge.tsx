import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "neutral";
  className?: string;
}

/**
 * Reusable Badge component with variant styling
 * @param label - Badge text content
 * @param variant - Badge color variant
 * @param className - Additional CSS classes
 */
export default function Badge({ label, variant = "neutral", className }: BadgeProps) {
  const variantClasses = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
