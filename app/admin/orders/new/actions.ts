"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/middleware-utils";
import { logOrderAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema voor order validatie
const orderSchema = z.object({
  klantnaam: z.string().min(1, "Klantnaam is verplicht"),
  producten: z.string().min(1, "Producten zijn verplicht"),
  totaalbedrag: z
    .string()
    .min(1, "Totaalbedrag is verplicht")
    .regex(/^\d+(\.\d{1,2})?$/, "Voer een geldig bedrag in"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
  opmerkingen: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export async function createOrder(formData: FormData) {
  try {
    // Check authentication and admin role
    await requireAdmin();

    // Parse and validate form data
    const rawData = {
      klantnaam: formData.get("klantnaam") as string,
      producten: formData.get("producten") as string,
      totaalbedrag: formData.get("totaalbedrag") as string,
      status: formData.get("status") as string,
      opmerkingen: (formData.get("opmerkingen") as string) || "",
    };

    const validatedData = orderSchema.parse(rawData);

    // Validate totaalbedrag
    const bedragNum = parseFloat(validatedData.totaalbedrag);
    if (bedragNum <= 0) {
      throw new Error("Totaalbedrag moet groter zijn dan 0");
    }

    // Find customer by name
    const customer = await prisma.customer.findFirst({
      where: { name: validatedData.klantnaam },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        userId: customer.id, // Using customer ID as user ID for now
        status: validatedData.status as any,
        totalAmount: bedragNum,
        notes: validatedData.opmerkingen,
      },
    });

    // Log the order creation
    await logOrderAction("CREATE", order.id, {
      customerName: validatedData.klantnaam,
      totalAmount: validatedData.totaalbedrag,
      status: validatedData.status,
      products: validatedData.producten,
      notes: validatedData.opmerkingen,
    });

    // Revalidate cache before redirect
    revalidatePath("/admin/orders");

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
    console.error("Error creating order:", error);
    throw error;
  }
}
