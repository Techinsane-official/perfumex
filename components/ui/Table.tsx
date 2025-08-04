import React from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  headers: string[];
  rows: React.ReactNode[][];
  sticky?: boolean;
  className?: string;
}

/**
 * Reusable Table component with headers and rows
 * @param headers - Array of header strings
 * @param rows - Array of row arrays containing React nodes
 * @param sticky - Whether headers should be sticky
 * @param className - Additional CSS classes
 */
export default function Table({ headers, rows, sticky = false, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className={cn("bg-gray-50", sticky && "sticky top-0 z-10")}>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
