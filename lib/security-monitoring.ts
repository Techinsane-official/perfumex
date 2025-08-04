import { NextRequest } from "next/server";

interface SecurityEvent {
  timestamp: Date;
  type:
    | "auth_failure"
    | "rate_limit"
    | "csrf_violation"
    | "validation_error"
    | "suspicious_activity";
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
}

interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// In-memory storage (in production, use database)
const securityEvents: SecurityEvent[] = [];
const securityAlerts: SecurityAlert[] = [];

/**
 * Log security event
 */
export function logSecurityEvent(
  type: SecurityEvent["type"],
  request: NextRequest,
  details: Record<string, unknown> = {},
  severity: SecurityEvent["severity"] = "medium",
): void {
  const event: SecurityEvent = {
    timestamp: new Date(),
    type,
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    path: request.nextUrl.pathname,
    method: request.method,
    details,
    severity,
  };

  securityEvents.push(event);

  // Keep only last 1000 events
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, securityEvents.length - 1000);
  }

  // Check for suspicious patterns
  checkSuspiciousPatterns(event);
}

/**
 * Check for suspicious activity patterns
 */
function checkSuspiciousPatterns(event: SecurityEvent): void {
  const recentEvents = securityEvents.filter(
    (e) => e.timestamp > new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
  );

  // Multiple auth failures from same IP
  const authFailures = recentEvents.filter((e) => e.type === "auth_failure" && e.ip === event.ip);

  if (authFailures.length >= 5) {
    createSecurityAlert(
      "multiple_auth_failures",
      `Multiple authentication failures from IP ${event.ip}`,
      "high",
    );
  }

  // Multiple rate limit violations
  const rateLimitViolations = recentEvents.filter(
    (e) => e.type === "rate_limit" && e.ip === event.ip,
  );

  if (rateLimitViolations.length >= 10) {
    createSecurityAlert(
      "excessive_rate_limit_violations",
      `Excessive rate limit violations from IP ${event.ip}`,
      "high",
    );
  }

  // Suspicious user agents
  const suspiciousUserAgents = [
    "bot",
    "crawler",
    "scraper",
    "spider",
    "curl",
    "wget",
    "python",
    "java",
  ];

  const userAgent = event.userAgent.toLowerCase();
  if (suspiciousUserAgents.some((agent) => userAgent.includes(agent))) {
    createSecurityAlert(
      "suspicious_user_agent",
      `Suspicious user agent: ${event.userAgent}`,
      "medium",
    );
  }

  // Multiple CSRF violations
  const csrfViolations = recentEvents.filter(
    (e) => e.type === "csrf_violation" && e.ip === event.ip,
  );

  if (csrfViolations.length >= 3) {
    createSecurityAlert(
      "multiple_csrf_violations",
      `Multiple CSRF violations from IP ${event.ip}`,
      "critical",
    );
  }
}

/**
 * Create security alert
 */
function createSecurityAlert(
  type: string,
  message: string,
  severity: SecurityAlert["severity"],
): void {
  const alert: SecurityAlert = {
    id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    timestamp: new Date(),
    type,
    message,
    severity,
    resolved: false,
  };

  securityAlerts.push(alert);

  // Keep only last 100 alerts
  if (securityAlerts.length > 100) {
    securityAlerts.splice(0, securityAlerts.length - 100);
  }

  // Log alert to console in development
  if (process.env.NODE_ENV === "development") {
    console.warn(`🚨 SECURITY ALERT [${severity.toUpperCase()}]: ${message}`);
  }
}

/**
 * Get security events
 */
export function getSecurityEvents(
  limit: number = 100,
  type?: SecurityEvent["type"],
): SecurityEvent[] {
  let events = securityEvents;

  if (type) {
    events = events.filter((e) => e.type === type);
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
}

/**
 * Get security alerts
 */
export function getSecurityAlerts(resolved?: boolean): SecurityAlert[] {
  let alerts = securityAlerts;

  if (resolved !== undefined) {
    alerts = alerts.filter((a) => a.resolved === resolved);
  }

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Resolve security alert
 */
export function resolveSecurityAlert(alertId: string, resolvedBy: string): boolean {
  const alert = securityAlerts.find((a) => a.id === alertId);

  if (!alert) {
    return false;
  }

  alert.resolved = true;
  alert.resolvedAt = new Date();
  alert.resolvedBy = resolvedBy;

  return true;
}

/**
 * Get security statistics
 */
export function getSecurityStats(): {
  totalEvents: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  eventsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  recentActivity: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
  };
} {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const eventsByType: Record<string, number> = {};
  securityEvents.forEach((event) => {
    eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
  });

  const alertsBySeverity: Record<string, number> = {};
  securityAlerts.forEach((alert) => {
    alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
  });

  return {
    totalEvents: securityEvents.length,
    totalAlerts: securityAlerts.length,
    unresolvedAlerts: securityAlerts.filter((a) => !a.resolved).length,
    eventsByType,
    alertsBySeverity,
    recentActivity: {
      lastHour: securityEvents.filter((e) => e.timestamp > oneHourAgo).length,
      lastDay: securityEvents.filter((e) => e.timestamp > oneDayAgo).length,
      lastWeek: securityEvents.filter((e) => e.timestamp > oneWeekAgo).length,
    },
  };
}

/**
 * Clean up old events and alerts
 */
export function cleanupOldData(): void {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Remove events older than 1 month
  const eventIndex = securityEvents.findIndex((e) => e.timestamp > oneMonthAgo);
  if (eventIndex > 0) {
    securityEvents.splice(0, eventIndex);
  }

  // Remove resolved alerts older than 1 month
  const alertIndex = securityAlerts.findIndex(
    (a) => a.resolved && a.resolvedAt && a.resolvedAt > oneMonthAgo,
  );
  if (alertIndex > 0) {
    securityAlerts.splice(0, alertIndex);
  }
}

// Clean up old data every hour
setInterval(cleanupOldData, 60 * 60 * 1000);
