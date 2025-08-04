import { auth } from "@/lib/auth";
import { prisma } from "./prisma";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "LOGIN"
  | "LOGOUT"
  | "IMPORT"
  | "EXPORT"
  | "BULK_UPDATE"
  | "PRICE_CHANGE"
  | "STOCK_UPDATE"
  | "CUSTOMER_ACTIVATION"
  | "CUSTOMER_DEACTIVATION"
  | "USER_ROLE_CHANGE"
  | "SYSTEM_CONFIG_CHANGE";

export type AuditEntity =
  | "USER"
  | "PRODUCT"
  | "CUSTOMER"
  | "ORDER"
  | "CATEGORY"
  | "BRAND"
  | "PROMOTION"
  | "IMPORT"
  | "SYSTEM";

export interface AuditLogData {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData, request?: Request) {
  try {
    // Get session from request context
    const session = await auth();
    const userId = session?.user?.id;

    // Get IP address and user agent from request
    let ipAddress = data.ipAddress || "unknown";
    let userAgent = data.userAgent || "unknown";

    if (request) {
      ipAddress =
        data.ipAddress ||
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "unknown";
      userAgent = data.userAgent || request.headers.get("user-agent") || "unknown";
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        details: data.details || {},
        ipAddress,
        userAgent,
      },
    });

    return auditLog;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
}

/**
 * Log product-related actions
 */
export async function logProductAction(
  action: AuditAction,
  productId: string,
  details?: Record<string, unknown>,
  request?: Request,
) {
  return createAuditLog(
    {
      action,
      entity: "PRODUCT",
      entityId: productId,
      details: details || {},
    },
    request,
  );
}

/**
 * Log customer-related actions
 */
export async function logCustomerAction(
  action: AuditAction,
  customerId: string,
  details?: Record<string, unknown>,
  request?: Request,
) {
  return createAuditLog(
    {
      action,
      entity: "CUSTOMER",
      entityId: customerId,
      details: details || {},
    },
    request,
  );
}

/**
 * Log order-related actions
 */
export async function logOrderAction(
  action: AuditAction,
  orderId: string,
  details?: Record<string, unknown>,
  request?: Request,
) {
  return createAuditLog(
    {
      action,
      entity: "ORDER",
      entityId: orderId,
      details: details || {},
    },
    request,
  );
}

/**
 * Log user-related actions
 */
export async function logUserAction(
  action: AuditAction,
  targetUserId: string,
  details?: Record<string, unknown>,
  request?: Request,
) {
  return createAuditLog(
    {
      action,
      entity: "USER",
      entityId: targetUserId,
      details: details || {},
    },
    request,
  );
}

/**
 * Log system configuration changes
 */
export async function logSystemAction(
  action: AuditAction,
  details?: Record<string, unknown>,
  request?: Request,
) {
  return createAuditLog(
    {
      action,
      entity: "SYSTEM",
      details: details || {},
    },
    request,
  );
}

/**
 * Log import/export operations
 */
export async function logImportAction(
  action: AuditAction,
  entityType: AuditEntity,
  details?: Record<string, unknown>,
  request?: Request,
) {
  return createAuditLog(
    {
      action,
      entity: "IMPORT",
      details: {
        ...details,
        targetEntity: entityType,
      },
    },
    request,
  );
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { userId, action, entity, entityId, startDate, endDate, page = 1, limit = 50 } = options;

  const where: {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
  } = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entity: AuditEntity,
  entityId: string,
  options: {
    page?: number;
    limit?: number;
  } = {},
) {
  return getAuditLogs({
    entity,
    entityId,
    ...options,
  });
}

/**
 * Get user activity timeline
 */
export async function getUserActivityLogs(
  userId: string,
  options: {
    page?: number;
    limit?: number;
  } = {},
) {
  return getAuditLogs({
    userId,
    ...options,
  });
}

/**
 * Export audit logs for compliance
 */
export async function exportAuditLogs(options: {
  startDate: Date;
  endDate: Date;
  format?: "csv" | "json";
}) {
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: options.startDate,
        lte: options.endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (options.format === "csv") {
    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      username: log.user?.username,
      userRole: log.user?.role,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: JSON.stringify(log.details),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  return logs;
}
