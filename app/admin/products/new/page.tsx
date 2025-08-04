import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createCsrfToken } from "@/lib/csrf";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const session = await auth();

  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    redirect("/login/admin");
  }

  const csrfToken = createCsrfToken();

  return <ProductForm csrfToken={csrfToken} session={session} />;
}
