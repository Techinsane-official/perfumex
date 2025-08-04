import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeHref: string;
  className?: string;
}

/**
 * Reusable Sidebar component with navigation items
 * @param items - Array of navigation items with label, icon, and href
 * @param activeHref - Currently active route
 * @param className - Additional CSS classes
 */
export default function Sidebar({ items, activeHref, className }: SidebarProps) {
  return (
    <nav
      className={cn(
        "bg-white border-r border-gray-200 w-64 min-h-screen",
        "hidden md:block", // Hidden on mobile by default
        className,
      )}
    >
      <div className="px-4 py-6">
        <div className="space-y-1">
          {items.map((item, index) => {
            const isActive = activeHref === item.href;

            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
