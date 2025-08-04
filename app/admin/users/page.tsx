// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UserManagementClient from "./UserManagementClient";

export default async function UsersPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return (
    <DashboardLayout user={session.user}>
      <UserManagementClient session={session} />
    </DashboardLayout>
  );
}
