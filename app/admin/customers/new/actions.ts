"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/middleware-utils";
import { logCustomerAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema voor klant validatie
const customerSchema = z.object({
  bedrijfsnaam: z.string().min(1, "Bedrijfsnaam is verplicht"),
  contactpersoon: z.string().min(1, "Contactpersoon is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  marge: z
    .string()
    .min(1, "Marge is verplicht")
    .regex(/^\d+(\.\d{1,2})?$/, "Voer een geldig percentage in"),
  actief: z.boolean(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export async function createCustomer(formData: FormData) {
  try {
    // Check authentication and admin role
    await requireAdmin();

    // Parse and validate form data
    const rawData = {
      bedrijfsnaam: formData.get("bedrijfsnaam") as string,
      contactpersoon: formData.get("contactpersoon") as string,
      email: formData.get("email") as string,
      marge: formData.get("marge") as string,
      actief: formData.get("actief") === "true",
    };

    const validatedData = customerSchema.parse(rawData);

    // Validate marge percentage
    const margeNum = parseFloat(validatedData.marge);
    if (margeNum < 0 || margeNum > 100) {
      throw new Error("Marge moet tussen 0 en 100% liggen");
    }

    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        name: validatedData.bedrijfsnaam,
        email: validatedData.email,
        phone: validatedData.contactpersoon,
        isActive: validatedData.actief,
      },
    });

    // Create customer margin
    await prisma.customerMargin.create({
      data: {
        customerId: customer.id,
        margin: margeNum,
        isActive: validatedData.actief,
      },
    });

    // Log the customer creation
    await logCustomerAction("CREATE", customer.id, {
      customerName: validatedData.bedrijfsnaam,
      contactPerson: validatedData.contactpersoon,
      email: validatedData.email,
      margin: validatedData.marge,
      isActive: validatedData.actief,
    });

    // Revalidate cache before redirect
    revalidatePath("/admin/customers");

    // Redirect after successful creation - this will throw NEXT_REDIRECT exception
    // which is expected behavior and should not be logged as an error
    redirect("/admin/dashboard");
  } catch (error) {
    // Filter out NEXT_REDIRECT exceptions - these are expected and should not be logged as errors
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      // This is a successful redirect, not an error - re-throw to allow Next.js to handle it
      throw error;
    }

    // Log only real errors, not redirects
    console.error("Error creating customer:", error);
    throw error;
  }
}
