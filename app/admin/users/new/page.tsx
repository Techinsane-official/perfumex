// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export default async function CreateUserPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return (
    <main className="max-w-screen-md mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Nieuwe Gebruiker Aanmaken</h1>
        <CreateUserForm />
      </div>
    </main>
  );
}
