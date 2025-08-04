import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Security headers configuration
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-Robots-Tag": "noindex, nofollow",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

// Define route patterns that require authentication
const protectedRoutes = ["/admin", "/dashboard", "/api/admin"];

// Define admin-only routes
const adminOnlyRoutes = ["/admin", "/api/admin"];

// Define buyer-only routes
const buyerOnlyRoutes = ["/dashboard"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Development bypass option
  if (process.env.NODE_ENV === "development" && process.env.SKIP_MIDDLEWARE === "true") {
    return NextResponse.next();
  }

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/sw.js")
  ) {
    const response = NextResponse.next();

    // Add security headers even for static files
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!requiresAuth) {
    return response;
  }

  try {
    // Get session
    const session = await auth();

    if (!session) {
      // Redirect to login for protected routes
      if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }

      // Return 401 for API routes
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Check admin-only routes
    if (adminOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (!session || session.user?.role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }
    }

    // Check buyer-only routes
    if (buyerOnlyRoutes.some((route) => pathname.startsWith(route))) {
      if (!session || session.user?.role !== "BUYER") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Buyer access required" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // For API routes, return error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // For pages, redirect to login
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
