// ✅ Forceer dynamische rendering voor admin mobile routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileAdminDashboard } from "@/components/admin/MobileAdminDashboard";
import { MobileNavigation } from "@/components/ui/MobileNavigation";

export default async function MobileAdminPage() {
  const session = await auth();

  if (!session || (session.user as Record<string, unknown>)?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Admin Mobile</h1>
              <span className="text-sm text-gray-500">Welkom, {session.user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MobileAdminDashboard />
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation userRole="ADMIN" username={session.user?.username || ""} />
    </div>
  );
}
