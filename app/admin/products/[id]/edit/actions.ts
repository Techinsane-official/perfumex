"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/middleware-utils";
import { logProductAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod schema voor product validatie
const productSchema = z.object({
  merk: z.string().min(1, "Merk is verplicht"),
  naam: z.string().min(1, "Productnaam is verplicht"),
  inhoud: z.string().min(1, "Inhoud is verplicht"),
  ean: z
    .string()
    .min(1, "EAN-code is verplicht")
    .regex(/^\d+$/, "EAN moet alleen cijfers bevatten"),
  inkoopprijs: z
    .string()
    .min(1, "Inkoopprijs is verplicht")
    .regex(/^\d+(\.\d{1,2})?$/, "Voer een geldig bedrag in"),
  verkoopprijs: z
    .string()
    .min(1, "Verkoopprijs is verplicht")
    .regex(/^\d+(\.\d{1,2})?$/, "Voer een geldig bedrag in"),
  voorraad: z
    .string()
    .min(1, "Voorraad is verplicht")
    .regex(/^\d+$/, "Voorraad moet een geheel getal zijn"),
  categorie: z.string().min(1, "Categorie is verplicht"),
  subcategorie: z.string().min(1, "Subcategorie is verplicht"),
  status: z.enum(["CONCEPT", "ACTIEF", "NIET_BESCHIKBAAR", "VERVALLEN"], {
    required_error: "Status is verplicht",
  }),
});

export type ProductFormData = z.infer<typeof productSchema>;

export async function updateProduct(productId: string, formData: FormData) {
  try {
    // Check authentication and admin role
    await requireAdmin();

    // Parse and validate form data
    const rawData = {
      merk: formData.get("merk") as string,
      naam: formData.get("naam") as string,
      inhoud: formData.get("inhoud") as string,
      ean: formData.get("ean") as string,
      inkoopprijs: formData.get("inkoopprijs") as string,
      verkoopprijs: formData.get("verkoopprijs") as string,
      voorraad: formData.get("voorraad") as string,
      categorie: formData.get("categorie") as string,
      subcategorie: formData.get("subcategorie") as string,
      status: formData.get("status") as string,
    };

    const validatedData = productSchema.parse(rawData);

    // Check if EAN already exists for another product
    const existingProduct = await prisma.product.findFirst({
      where: {
        ean: validatedData.ean,
        id: { not: productId },
      },
    });

    if (existingProduct) {
      throw new Error("EAN-code is al in gebruik door een ander product");
    }

    // Update product in database
    await prisma.product.update({
      where: { id: productId },
      data: {
        brand: validatedData.merk,
        name: validatedData.naam,
        content: validatedData.inhoud,
        ean: validatedData.ean,
        purchasePrice: parseFloat(validatedData.inkoopprijs),
        retailPrice: parseFloat(validatedData.verkoopprijs),
        stockQuantity: parseInt(validatedData.voorraad),
        category: validatedData.categorie,
        subcategory: validatedData.subcategorie,
        status: validatedData.status,
      },
    });

    // Log the product update
    await logProductAction("UPDATE", productId, {
      productName: validatedData.naam,
      brand: validatedData.merk,
      ean: validatedData.ean,
      purchasePrice: validatedData.inkoopprijs,
      retailPrice: validatedData.verkoopprijs,
      stock: validatedData.voorraad,
      category: validatedData.categorie,
      subcategory: validatedData.subcategorie,
      status: validatedData.status,
    });

    // Revalidate cache before redirect
    revalidatePath("/admin/products");

    // Redirect after successful update - this will throw NEXT_REDIRECT exception
    // which is expected behavior and should not be logged as an error
    redirect("/admin/products");
  } catch (error) {
    // Filter out NEXT_REDIRECT exceptions - these are expected and should not be logged as errors
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      // This is a successful redirect, not an error - re-throw to allow Next.js to handle it
      throw error;
    }

    // Log only real errors, not redirects
    console.error("Error updating product:", error);
    throw error;
  }
}
