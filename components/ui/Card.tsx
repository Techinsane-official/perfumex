import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable Card component with title and footer options
 * @param title - Optional card title
 * @param footer - Optional footer content
 * @param children - Card content
 * @param className - Additional CSS classes
 */
export default function Card({ title, footer, children, className }: CardProps) {
  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}

      <div className="px-6 py-4">{children}</div>

      {footer && <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">{footer}</div>}
    </div>
  );
}
