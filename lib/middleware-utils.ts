import { headers } from "next/headers";

/**
 * Get user role from middleware headers
 */
export async function getUserRole(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("x-user-role");
  } catch (error) {
    console.error("Error getting user role from headers:", error);
    return null;
  }
}

/**
 * Get user ID from middleware headers
 */
export async function getUserId(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("x-user-id");
  } catch (error) {
    console.error("Error getting user ID from headers:", error);
    return null;
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "ADMIN";
}

/**
 * Check if current user is buyer
 */
export async function isBuyer(): Promise<boolean> {
  const role = await getUserRole();
  return role === "BUYER";
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const role = await getUserRole();
  return role !== null;
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Admin access required");
  }
}

/**
 * Require buyer role - throws error if not buyer
 */
export async function requireBuyer(): Promise<void> {
  if (!(await isBuyer())) {
    throw new Error("Buyer access required");
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    throw new Error("Authentication required");
  }
}
