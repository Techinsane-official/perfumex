// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserList } from "@/components/admin/UserList";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gebruikersbeheer</h1>
      <UserList />
    </main>
  );
}
