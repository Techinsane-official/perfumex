import { Decimal } from "@prisma/client/runtime/library";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      customerId?: string;
      markup?: number;
    };
  }

  interface User {
    id: string;
    username: string;
    role: string;
    customerId?: string;
    markup?: number;
  }
}

// Utility types for safe Prisma type handling
export type SafeDecimal = number | string;
export type SafeJson = Record<string, unknown>;

// Helper function type for converting Decimal to safe number
export function toSafeNumber(value: Decimal | string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object" && "toNumber" in value) {
    return (value as Decimal).toNumber();
  }
  return Number(value) || 0;
}

// Helper function type for converting JsonValue to safe object
export function toSafeJson(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
    markup?: number;
  }
}
