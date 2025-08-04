import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Reusable Modal component based on Radix Dialog
 * @param open - Modal open state
 * @param onOpenChange - Open state change handler
 * @param title - Modal title
 * @param description - Optional modal description
 * @param children - Modal content
 * @param footer - Optional footer content
 * @param className - Additional CSS classes
 */
export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "bg-white rounded-lg shadow-xl z-50 w-full max-w-md mx-4",
            "max-h-[90vh] overflow-y-auto",
            className,
          )}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                {description}
              </Dialog.Description>
            )}
          </div>

          <div className="px-6 py-4">{children}</div>

          {footer && <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">{footer}</div>}

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
