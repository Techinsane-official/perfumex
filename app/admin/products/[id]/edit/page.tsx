"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { z } from "zod";
import BackButton from "@/components/ui/BackButton";
import { updateProduct } from "./actions";

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
  maxBestelbaar: z
    .string()
    .min(1, "Max bestelbaar is verplicht")
    .regex(/^\d+$/, "Max bestelbaar moet een geheel getal zijn"),
  sterren: z
    .string()
    .min(1, "Sterren is verplicht")
    .regex(/^\d+$/, "Sterren moet een geheel getal zijn"),
  categorie: z.string().min(1, "Categorie is verplicht"),
  subcategorie: z.string().min(1, "Subcategorie is verplicht"),
  beschrijving: z.string().optional(),
  actief: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Mock product data (in real app, this would come from API)
const mockProduct = {
  id: "1",
  merk: "Chanel",
  naam: "N°5 Eau de Parfum",
  inhoud: "100ml",
  ean: "1234567890123",
  inkoopprijs: "25.50",
  verkoopprijs: "45.00",
  voorraad: "150",
  maxBestelbaar: "50",
  sterren: "5",
  categorie: "Dames",
  subcategorie: "Eau de Parfum",
  beschrijving: "Een tijdloze klassieker met een verfijnde bloemige geur",
  actief: true,
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Unpack params at the top of the component
  const { id } = use(params);

  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProductFormData>({
    merk: "",
    naam: "",
    inhoud: "",
    ean: "",
    inkoopprijs: "",
    verkoopprijs: "",
    voorraad: "",
    maxBestelbaar: "",
    sterren: "",
    categorie: "",
    subcategorie: "",
    beschrijving: "",
    actief: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/admin");
    } else if (
      status === "authenticated" &&
      (session?.user as Record<string, unknown>)?.role !== "ADMIN"
    ) {
      router.push("/login/admin");
    }
  }, [status, session, router]);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }
        const product = await response.json();

        setFormData({
          merk: product.brand,
          naam: product.name,
          inhoud: product.content,
          ean: product.ean,
          inkoopprijs: product.purchasePrice.toString(),
          verkoopprijs: product.retailPrice.toString(),
          voorraad: product.stockQuantity.toString(),
          maxBestelbaar: product.maxOrderableQuantity?.toString() || "",
          sterren: product.starRating.toString(),
          categorie: product.category || "",
          subcategorie: product.subcategory || "",
          beschrijving: product.description || "",
          actief: product.isActive,
        });
      } catch (error) {
        console.error("Error loading product:", error);
        alert("Fout bij het laden van product gegevens");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      loadProduct();
    }
  }, [id, status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user as Record<string, unknown>)?.role !== "ADMIN") {
    return null;
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev: ProductFormData) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = productSchema.parse(formData);

      // Validate prices
      const inkoopNum = parseFloat(validatedData.inkoopprijs);
      const verkoopNum = parseFloat(validatedData.verkoopprijs);
      if (inkoopNum <= 0 || verkoopNum <= 0) {
        setErrors({
          inkoopprijs: inkoopNum <= 0 ? "Inkoopprijs moet groter zijn dan 0" : "",
          verkoopprijs: verkoopNum <= 0 ? "Verkoopprijs moet groter zijn dan 0" : "",
        });
        return;
      }

      // Create FormData for server action
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("merk", validatedData.merk);
      formDataToSubmit.append("naam", validatedData.naam);
      formDataToSubmit.append("inhoud", validatedData.inhoud);
      formDataToSubmit.append("ean", validatedData.ean);
      formDataToSubmit.append("inkoopprijs", validatedData.inkoopprijs);
      formDataToSubmit.append("verkoopprijs", validatedData.verkoopprijs);
      formDataToSubmit.append("voorraad", validatedData.voorraad);
      formDataToSubmit.append("categorie", validatedData.categorie);
      formDataToSubmit.append("subcategorie", validatedData.subcategorie);

      // Submit to server action
      await updateProduct(id, formDataToSubmit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Product Bewerken</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welkom, {(session.user as { username?: string })?.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/admin/dashboard" />

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Informatie</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Merk */}
              <div>
                <label htmlFor="merk" className="block text-sm font-medium text-gray-700 mb-1">
                  Merk *
                </label>
                <input
                  type="text"
                  id="merk"
                  value={formData.merk}
                  onChange={(e) => handleInputChange("merk", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.merk ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. Chanel, Dior, etc."
                />
                {errors.merk && <p className="mt-1 text-sm text-red-600">{errors.merk}</p>}
              </div>

              {/* Productnaam */}
              <div>
                <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-1">
                  Productnaam *
                </label>
                <input
                  type="text"
                  id="naam"
                  value={formData.naam}
                  onChange={(e) => handleInputChange("naam", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.naam ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. N°5 Eau de Parfum"
                />
                {errors.naam && <p className="mt-1 text-sm text-red-600">{errors.naam}</p>}
              </div>

              {/* Inhoud */}
              <div>
                <label htmlFor="inhoud" className="block text-sm font-medium text-gray-700 mb-1">
                  Inhoud *
                </label>
                <select
                  id="inhoud"
                  value={formData.inhoud}
                  onChange={(e) => handleInputChange("inhoud", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.inhoud ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Selecteer inhoud</option>
                  <option value="30ml">30ml</option>
                  <option value="50ml">50ml</option>
                  <option value="75ml">75ml</option>
                  <option value="100ml">100ml</option>
                  <option value="125ml">125ml</option>
                  <option value="150ml">150ml</option>
                  <option value="200ml">200ml</option>
                  <option value="250ml">250ml</option>
                  <option value="500ml">500ml</option>
                  <option value="1000ml">1000ml</option>
                </select>
                {errors.inhoud && <p className="mt-1 text-sm text-red-600">{errors.inhoud}</p>}
              </div>

              {/* EAN Code */}
              <div>
                <label htmlFor="ean" className="block text-sm font-medium text-gray-700 mb-1">
                  EAN Code *
                </label>
                <input
                  type="text"
                  id="ean"
                  value={formData.ean}
                  onChange={(e) => handleInputChange("ean", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.ean ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. 1234567890123"
                />
                {errors.ean && <p className="mt-1 text-sm text-red-600">{errors.ean}</p>}
              </div>

              {/* Inkoopprijs */}
              <div>
                <label
                  htmlFor="inkoopprijs"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Inkoopprijs (€) *
                </label>
                <input
                  type="text"
                  id="inkoopprijs"
                  value={formData.inkoopprijs}
                  onChange={(e) => handleInputChange("inkoopprijs", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.inkoopprijs ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. 25.50"
                />
                {errors.inkoopprijs && (
                  <p className="mt-1 text-sm text-red-600">{errors.inkoopprijs}</p>
                )}
              </div>

              {/* Verkoopprijs */}
              <div>
                <label
                  htmlFor="verkoopprijs"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Verkoopprijs (€) *
                </label>
                <input
                  type="text"
                  id="verkoopprijs"
                  value={formData.verkoopprijs}
                  onChange={(e) => handleInputChange("verkoopprijs", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.verkoopprijs ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. 45.00"
                />
                {errors.verkoopprijs && (
                  <p className="mt-1 text-sm text-red-600">{errors.verkoopprijs}</p>
                )}
              </div>

              {/* Voorraad */}
              <div>
                <label htmlFor="voorraad" className="block text-sm font-medium text-gray-700 mb-1">
                  Voorraad *
                </label>
                <input
                  type="number"
                  id="voorraad"
                  value={formData.voorraad}
                  onChange={(e) => handleInputChange("voorraad", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.voorraad ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. 100"
                  min="0"
                />
                {errors.voorraad && <p className="mt-1 text-sm text-red-600">{errors.voorraad}</p>}
              </div>

              {/* Max Bestelbaar */}
              <div>
                <label
                  htmlFor="maxBestelbaar"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Max Bestelbaar *
                </label>
                <input
                  type="number"
                  id="maxBestelbaar"
                  value={formData.maxBestelbaar}
                  onChange={(e) => handleInputChange("maxBestelbaar", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.maxBestelbaar ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. 50"
                  min="0"
                />
                {errors.maxBestelbaar && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxBestelbaar}</p>
                )}
              </div>

              {/* Sterren */}
              <div>
                <label htmlFor="sterren" className="block text-sm font-medium text-gray-700 mb-1">
                  Sterren *
                </label>
                <select
                  id="sterren"
                  value={formData.sterren}
                  onChange={(e) => handleInputChange("sterren", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.sterren ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Selecteer sterren</option>
                  <option value="1">1 ster</option>
                  <option value="2">2 sterren</option>
                  <option value="3">3 sterren</option>
                  <option value="4">4 sterren</option>
                  <option value="5">5 sterren</option>
                </select>
                {errors.sterren && <p className="mt-1 text-sm text-red-600">{errors.sterren}</p>}
              </div>

              {/* Categorie */}
              <div>
                <label htmlFor="categorie" className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie *
                </label>
                <input
                  type="text"
                  id="categorie"
                  value={formData.categorie}
                  onChange={(e) => handleInputChange("categorie", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.categorie ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. Dames, Heren, Unisex"
                />
                {errors.categorie && (
                  <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>
                )}
              </div>

              {/* Subcategorie */}
              <div>
                <label
                  htmlFor="subcategorie"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subcategorie *
                </label>
                <input
                  type="text"
                  id="subcategorie"
                  value={formData.subcategorie}
                  onChange={(e) => handleInputChange("subcategorie", e.target.value)}
                  className={`w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                    errors.subcategorie ? "border-red-500" : ""
                  }`}
                  placeholder="Bijv. Eau de Parfum, Eau de Toilette"
                />
                {errors.subcategorie && (
                  <p className="mt-1 text-sm text-red-600">{errors.subcategorie}</p>
                )}
              </div>

              {/* Actief checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="actief"
                  checked={formData.actief}
                  onChange={(e) => handleInputChange("actief", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="actief" className="ml-2 block text-sm text-gray-700">
                  Product is actief
                </label>
              </div>

              {/* Beschrijving */}
              <div className="md:col-span-2">
                <label
                  htmlFor="beschrijving"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Beschrijving
                </label>
                <textarea
                  id="beschrijving"
                  value={formData.beschrijving}
                  onChange={(e) => handleInputChange("beschrijving", e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="Product beschrijving..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Bezig met opslaan..." : "Product Bijwerken"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
