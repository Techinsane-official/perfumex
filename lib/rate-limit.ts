import { NextRequest } from "next/server";

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

/**
 * Default key generator for rate limiting
 */
function defaultKeyGenerator(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent}`;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: defaultKeyGenerator,
      ...config,
    };
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter: number;
  }> {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();

    // Get current rate limit data
    const current = rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      // First request or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        retryAfter: 0,
      };
    }

    if (current.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count,
      resetTime: current.resetTime,
      retryAfter: 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Predefined rate limiters
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const adminRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50, // 50 requests per minute
});

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    authRateLimiter.cleanup();
    apiRateLimiter.cleanup();
    adminRateLimiter.cleanup();
  },
  5 * 60 * 1000,
);
