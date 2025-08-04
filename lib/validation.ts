import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize plain text
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeText(email).toLowerCase();

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize phone number
 */
export function validatePhone(phone: string): string | null {
  const sanitized = sanitizeText(phone).replace(/[^\d+\-\(\)\s]/g, "");

  if (sanitized.length < 8 || sanitized.length > 20) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize EAN code
 */
export function validateEAN(ean: string): string | null {
  const sanitized = sanitizeText(ean).replace(/[^\d]/g, "");

  if (sanitized.length !== 13) {
    return null;
  }

  // EAN-13 checksum validation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(sanitized[i] || "0") * (i % 2 === 0 ? 1 : 3);
  }

  const checksum = (10 - (sum % 10)) % 10;
  if (parseInt(sanitized[12] || "0") !== checksum) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize price
 */
export function validatePrice(price: string | number): number | null {
  const num = typeof price === "string" ? parseFloat(sanitizeText(price)) : price;

  if (isNaN(num) || num < 0 || num > 999999.99) {
    return null;
  }

  return Math.round(num * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate and sanitize quantity
 */
export function validateQuantity(quantity: string | number): number | null {
  const num = typeof quantity === "string" ? parseInt(sanitizeText(quantity)) : quantity;

  if (isNaN(num) || num < 0 || num > 999999) {
    return null;
  }

  return num;
}

/**
 * Validate and sanitize percentage
 */
export function validatePercentage(percentage: string | number): number | null {
  const num = typeof percentage === "string" ? parseFloat(sanitizeText(percentage)) : percentage;

  if (isNaN(num) || num < 0 || num > 100) {
    return null;
  }

  return Math.round(num * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate and sanitize URL
 */
export function validateURL(url: string): string | null {
  const sanitized = sanitizeText(url);

  try {
    const urlObj = new URL(sanitized);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null;
    }
    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize file name
 */
export function validateFileName(filename: string): string | null {
  const sanitized = sanitizeText(filename)
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
    .replace(/\.{2,}/g, ".") // Remove multiple dots
    .trim();

  if (sanitized.length === 0 || sanitized.length > 255) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): string | null {
  const sanitized = sanitizeText(query).trim();

  if (sanitized.length === 0 || sanitized.length > 100) {
    return null;
  }

  return sanitized;
}

/**
 * Zod schemas for common validations
 */
export const emailSchema = z.string().email().transform(sanitizeText);
export const phoneSchema = z.string().refine(validatePhone, "Invalid phone number");
export const eanSchema = z.string().refine(validateEAN, "Invalid EAN code");
export const priceSchema = z
  .number()
  .min(0)
  .max(999999.99)
  .transform((n) => Math.round(n * 100) / 100);
export const quantitySchema = z.number().int().min(0).max(999999);
export const percentageSchema = z
  .number()
  .min(0)
  .max(100)
  .transform((n) => Math.round(n * 100) / 100);
export const urlSchema = z.string().url().transform(sanitizeText);
export const fileNameSchema = z.string().refine(validateFileName, "Invalid file name");
export const searchQuerySchema = z.string().refine(validateSearchQuery, "Invalid search query");

/**
 * Sanitize form data
 */
export function sanitizeFormData(formData: FormData): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeText(value);
    } else {
      sanitized[key] = value; // Keep files as-is
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize object recursively
 */
export function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeText(obj);
  }

  if (typeof obj === "number") {
    return obj;
  }

  if (typeof obj === "boolean") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeText(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}
