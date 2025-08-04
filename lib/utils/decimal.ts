import { Decimal } from "@prisma/client/runtime/library";

/**
 * Converts a Prisma Decimal, number, string, or null/undefined to a safe number
 * @param value - The value to convert
 * @returns A safe number (0 if conversion fails)
 */
export function toSafeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object" && "toNumber" in value) {
    return (value as Decimal).toNumber();
  }
  return Number(value) || 0;
}

/**
 * Converts a Prisma Decimal to a string representation
 * @param value - The Decimal value to convert
 * @returns A string representation of the number
 */
export function toSafeString(value: Decimal | number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "object" && "toString" in value) {
    return (value as Decimal).toString();
  }
  return String(value);
}

/**
 * Safely formats a Decimal value as currency
 * @param value - The Decimal value to format
 * @param locale - The locale to use (default: nl-NL)
 * @param currency - The currency code (default: EUR)
 * @returns Formatted currency string
 */
export function formatDecimalAsCurrency(
  value: Decimal | number | string | null | undefined,
  locale = "nl-NL",
  currency = "EUR",
): string {
  const number = toSafeNumber(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(number);
}
