// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/lib/audit";
import { serializeDate } from "@/lib/utils";
import DashboardClient from "./DashboardClient";
import { Prisma } from "@prisma/client";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Prisma.JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

interface SerializedAuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Prisma.JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string; // Serialized as ISO string
  user?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  // Fetch recent audit logs for dashboard
  let recentLogs: AuditLog[] = [];
  try {
    const auditResult = await getAuditLogs({
      page: 1,
      limit: 10, // Show last 10 logs on dashboard
    });
    recentLogs = auditResult.logs;
  } catch (error) {
    console.error("Failed to fetch recent audit logs:", error);
    // Continue without logs if fetch fails
  }

  // Serialize dates to prevent hydration mismatches
  const serializedLogs: SerializedAuditLog[] = recentLogs.map((log) => ({
    ...log,
    createdAt: serializeDate(log.createdAt),
  }));

  // Debug logging for hydration mismatch investigation
  console.log("Server: Props being passed to DashboardClient", {
    session: {
      user: session.user
        ? {
            id: session.user.id,
            username: (session.user as { username?: string })?.username,
            role: (session.user as { role?: string })?.role,
          }
        : null,
    },
    recentLogs: serializedLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      createdAt: log.createdAt,
      user: log.user,
    })),
  });

  return <DashboardClient session={session} recentLogs={serializedLogs} />;
}
