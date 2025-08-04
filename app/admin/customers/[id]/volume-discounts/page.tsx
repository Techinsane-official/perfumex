// ✅ Forceer dynamische rendering voor admin routes met serverdata
export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VolumeDiscountsClient from "./VolumeDiscountsClient";

export default async function VolumeDiscountsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Volume Discounts</h1>
          <p className="text-gray-600">Manage tiered pricing for customer {params.id}</p>
        </div>
        <VolumeDiscountsClient customerId={params.id} />
      </div>
    </DashboardLayout>
  );
} 