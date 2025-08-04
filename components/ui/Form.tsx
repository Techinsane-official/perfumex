import React from "react";
import { cn } from "@/lib/utils";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * Reusable Form component wrapper with styling
 * @param children - Form content
 * @param disabled - Disabled state for all form fields
 * @param className - Additional CSS classes
 * @param onSubmit - Form submit handler
 */
export default function Form({
  children,
  disabled = false,
  className,
  onSubmit,
  ...props
}: FormProps) {
  return (
    <form onSubmit={onSubmit} className={cn("space-y-6", className)} {...props}>
      <fieldset disabled={disabled} className="space-y-6">
        {children}
      </fieldset>
    </form>
  );
}
