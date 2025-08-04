// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/lib/audit";
import AuditTrail from "@/components/admin/AuditTrail";

export default async function AuditTrailPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  // Fetch initial audit logs for the page
  let initialLogs = null;
  try {
    initialLogs = await getAuditLogs({
      page: 1,
      limit: 50,
    });
  } catch (error) {
    console.error("Failed to fetch initial audit logs:", error);
    // Continue without initial logs if fetch fails
  }

  return <AuditTrail initialLogs={initialLogs} />;
}
