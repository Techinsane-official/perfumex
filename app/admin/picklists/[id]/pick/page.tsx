import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PicklistPickClient from "./PicklistPickClient";

export default async function PicklistPickPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return <PicklistPickClient session={session} picklistId={params.id} />;
} 