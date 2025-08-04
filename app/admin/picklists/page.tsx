import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PicklistClient from "./PicklistClient";

export default async function PicklistsPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  return <PicklistClient session={session} />;
} 