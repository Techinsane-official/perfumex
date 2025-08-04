import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PicklistDetailClient from "./PicklistDetailClient";

export default async function PicklistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return <PicklistDetailClient session={session} picklistId={params.id} />;
} 