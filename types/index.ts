import { Decimal } from "@prisma/client/runtime/library";

/**
 * Safe types for Prisma Decimal handling
 */
export type SafeDecimal = number | string;

/**
 * Safe type for Prisma JsonValue
 */
export type SafeJson = Record<string, unknown>;

/**
 * Safe type for Prisma Decimal arrays
 */
export type SafeDecimalArray = (number | string)[];

/**
 * Interface for product override data
 */
export interface ProductOverride {
  id: string;
  productId: string;
  customerId: string;
  value: SafeDecimal;
  type: "PRICE" | "DISCOUNT" | "MARGIN";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for pricing calculation result
 */
export interface PricingResult {
  basePrice: number;
  marginAmount: number;
  marginPercentage: number;
  finalPrice: number;
  discountAmount: number;
  discountPercentage: number;
}

/**
 * Interface for export parameters
 */
export interface ExportParameters {
  format: "csv" | "excel" | "pdf";
  columns: string[];
  filters?: SafeJson;
  includePricing?: boolean;
}

/**
 * Interface for import parameters
 */
export interface ImportParameters {
  overwriteExisting: boolean;
  validateData: boolean;
  columnMapping: Record<string, string>;
}

/**
 * Helper function to safely convert unknown to SafeJson
 */
export function toSafeJson(value: unknown): SafeJson {
  if (value === null || value === undefined) return {};
  if (typeof value === "object" && value !== null) {
    return value as SafeJson;
  }
  return {};
}

/**
 * Helper function to safely convert unknown to SafeDecimal
 */
export function toSafeDecimal(value: unknown): SafeDecimal {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "toString" in value) {
    return (value as Decimal).toString();
  }
  return String(value);
}
