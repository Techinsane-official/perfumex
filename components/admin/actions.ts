"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateCsrfToken } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { mapFormFieldsToDatabase } from "@/lib/utils/mapFormFields";

export async function createProduct(formData: FormData) {
  // Outer try/catch for comprehensive error logging
  try {
    console.log("🚀 createProduct gestart");

    // 📥 Log alle ontvangen formulierdata
    console.log("📥 Ontvangen formulierdata:");
    for (const [key, value] of formData.entries()) {
      console.log(`🔹 ${key}:`, value);
    }

    // ✅ Stap 1: Debug EAN-waarde direct uit formData
    console.log("▶️ Inkomende EAN uit formData:", formData.get("ean"));
    console.log("▶️ EAN type:", typeof formData.get("ean"));
    console.log("▶️ EAN length:", (formData.get("ean") as string)?.length);

    // Inner try/catch voor business logic
    try {
      // ✅ 1. CSRF VALIDATIE
      const csrfToken = formData.get("csrf_token") as string;
      console.log("🔐 CSRF token ontvangen:", csrfToken ? "✅ Aanwezig" : "❌ Ontbreekt");

      if (!validateCsrfToken(csrfToken)) {
        console.warn("🚫 Ongeldig CSRF token ontvangen:", csrfToken);
        throw new Error("Ongeldig CSRF-token");
      }
      console.log("✅ CSRF token geldig");

      // ✅ 2. GEGEVENS EXTRAHEREN EN MAPPEN
      console.log("🔍 Start data extractie en mapping...");
      const {
        name,
        description,
        content,
        brand,
        ean,
        purchasePrice,
        retailPrice,
        stockQuantity,
        maxOrderableQuantity,
        starRating,
        category,
        subcategory,
        tags,
        isActive,
        images,
      } = mapFormFieldsToDatabase(formData);

      // ✅ Get status from form data (default to CONCEPT for new products)
      const status = (formData.get("status") as string) || "CONCEPT";

      // ✅ Extra EAN debugging na mapping
      console.log("🔍 EAN na mapping:", ean);
      console.log("🔍 EAN type na mapping:", typeof ean);
      console.log("🔍 EAN length na mapping:", ean?.length);
      console.log("🔍 EAN trimmed:", ean?.trim());

      console.log("📊 Gemapte data:", {
        name: name || "❌ Leeg",
        description: description || "❌ Leeg",
        content: content || "❌ Leeg",
        brand: brand || "❌ Leeg",
        ean: ean || "❌ Leeg",
        purchasePrice: isNaN(purchasePrice) ? "❌ Ongeldig" : purchasePrice,
        retailPrice: isNaN(retailPrice) ? "❌ Ongeldig" : retailPrice,
        stockQuantity: isNaN(stockQuantity) ? "❌ Ongeldig" : stockQuantity,
        maxOrderableQuantity,
        starRating,
        category,
        subcategory,
        tags: tags.length,
        isActive,
        status,
        images: images.length,
      });

      // ✅ 3. VALIDATIE
      console.log("🔍 Start validatie...");
      if (
        !name ||
        !content ||
        !brand ||
        !ean ||
        isNaN(purchasePrice) ||
        isNaN(retailPrice) ||
        isNaN(stockQuantity)
      ) {
        console.warn("🚫 Onvolledige of ongeldige invoer:", {
          name,
          content,
          brand,
          ean,
          purchasePrice,
          retailPrice,
          stockQuantity,
        });
        throw new Error("Vul alle verplichte velden correct in.");
      }
      console.log("✅ Validatie geslaagd");

      // ✅ 4. UNIEKHEIDSCONTROLE OP EAN - Verbeterde versie
      console.log("🔍 Controleer EAN uniekheid:", ean);

      // ✅ Stap 2: Check in de database of het EAN-nummer al bestaat
      const existing = await prisma.product.findUnique({
        where: { ean },
      });

      if (existing) {
        console.warn(`⚠️ Product met EAN ${ean} bestaat al in database.`);
        console.warn("🔍 Bestaand product details:", {
          id: existing.id,
          name: existing.name,
          brand: existing.brand,
          ean: existing.ean,
          createdAt: existing.createdAt,
        });
        throw new Error(`❌ Product met EAN ${ean} bestaat al.`);
      }
      console.log("✅ EAN is uniek");

      // ✅ 5. AANMAKEN PRODUCT
      console.log("💾 Start database operatie...");
      console.log("🔍 Product data voor aanmaak:", {
        name,
        description,
        content,
        brand,
        ean,
        purchasePrice,
        retailPrice,
        stockQuantity,
        status,
      });

      const nieuwProduct = await prisma.product.create({
        data: {
          name,
          description,
          content, // Required field for size/volume
          brand,
          ean,
          purchasePrice,
          retailPrice,
          stockQuantity, // Correct field name for Prisma
          maxOrderableQuantity,
          starRating,
          category,
          subcategory,
          tags,
          status,
          isActive,
        },
      });

      console.log("✅ Product succesvol aangemaakt:", nieuwProduct);

      // ✅ 6. IMAGES OPSLAAN
      if (images && images.length > 0) {
        console.log("📸 Start image opslag...");
        console.log("🔍 Images om op te slaan:", images);

        const imageData = images.map((imageUrl, index) => ({
          productId: nieuwProduct.id,
          url: imageUrl,
          isMain: index === 0, // First image is main
          order: index,
        }));

        await prisma.productImage.createMany({
          data: imageData,
        });

        console.log("✅ Images succesvol opgeslagen:", imageData.length);
      }

      // ✅ 7. CACHE REFRESH & REDIRECT
      console.log("🔄 Cache refresh en redirect...");
      revalidatePath("/admin/products");
      redirect("/admin/products");
    } catch (error: unknown) {
      if ((error as Record<string, unknown>)?.digest?.toString().startsWith("NEXT_REDIRECT")) {
        // Redirect is succesvol, geen error
        console.log("✅ Redirect succesvol uitgevoerd");
        throw error;
      }

      // ✅ Bonus: Verbeterde foutmeldingen
      console.error("❌ Fout bij productaanmaak:", error);
      console.error("❌ Error details:", {
        message: (error as Record<string, unknown>)?.message,
        name: (error as Record<string, unknown>)?.name,
        code: (error as Record<string, unknown>)?.code,
        stack: (error as Record<string, unknown>)?.stack,
      });
      throw new Error(
        ((error as Record<string, unknown>)?.message as string) ??
          "Onbekende fout bij productaanmaak",
      );
    }
  } catch (error: unknown) {
    // Outer catch voor onverwachte fouten
    console.error("🛑 Onverwachte fout in createProduct:", error);
    console.error("📋 Stack trace:", error?.stack || "Geen stack trace beschikbaar");
    console.error("🔍 Error details:", {
      name: error?.name,
      message: error?.message,
      digest: error?.digest,
      code: error?.code,
    });

    // Re-throw voor client handling
    throw error;
  }
}
