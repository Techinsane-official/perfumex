"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { marked } from "marked";
import BackButton from "@/components/ui/BackButton";
import ImageUpload from "@/components/ui/ImageUpload";
import BrandAutocomplete from "@/components/ui/BrandAutocomplete";
import TagsInput from "@/components/ui/TagsInput";
import { createProduct } from "./actions";

// Zod schema voor product validatie
const productSchema = z.object({
  merk: z.string().min(1, "Merk is verplicht").max(50, "Merk mag maximaal 50 tekens zijn"),
  naam: z
    .string()
    .min(1, "Productnaam is verplicht")
    .max(100, "Productnaam mag maximaal 100 tekens zijn")
    .regex(
      /^[a-zA-Z0-9\s\-'°&()]+$/,
      "Productnaam mag alleen letters, cijfers, spaties en speciale tekens bevatten",
    ),
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
    .regex(/^\d+$/, "Alleen positieve gehele getallen toegestaan")
    .refine((val) => parseInt(val) >= 0, "Voorraad mag niet negatief zijn"),
  status: z.enum(["CONCEPT", "ACTIEF", "NIET_BESCHIKBAAR", "VERVALLEN"], {
    required_error: "Status is verplicht",
  }),
  maxOrderQuantity: z.string().optional(),
  starRating: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  beschrijving: z.string().min(30, "Beschrijving moet minimaal 30 tekens bevatten"),
  afbeeldingen: z.array(z.string()).max(5, "Maximaal 5 afbeeldingen toegestaan"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  csrfToken: string;
  session: { user?: { username?: string } };
}

export default function ProductForm({ csrfToken, session }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProductFormData>({
    merk: "",
    naam: "",
    inhoud: "",
    ean: "",
    inkoopprijs: "",
    verkoopprijs: "",
    voorraad: "",
    status: "CONCEPT", // Default to CONCEPT for new products
    maxOrderQuantity: "",
    starRating: "",
    category: "",
    subcategory: "",
    tags: [],
    beschrijving: "",
    afbeeldingen: [],
  });

  const handleInputChange = (field: keyof ProductFormData, value: string | string[]) => {
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

      // Create FormData for server action
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("csrf_token", csrfToken);
      formDataToSubmit.append("merk", validatedData.merk);
      formDataToSubmit.append("naam", validatedData.naam);
      formDataToSubmit.append("inhoud", validatedData.inhoud);
      formDataToSubmit.append("ean", validatedData.ean);
      formDataToSubmit.append("inkoopprijs", validatedData.inkoopprijs);
      formDataToSubmit.append("verkoopprijs", validatedData.verkoopprijs);
      formDataToSubmit.append("voorraad", validatedData.voorraad);
      formDataToSubmit.append("status", validatedData.status);
      if (validatedData.maxOrderQuantity) {
        formDataToSubmit.append("maxOrderQuantity", validatedData.maxOrderQuantity);
      }
      if (validatedData.starRating) {
        formDataToSubmit.append("starRating", validatedData.starRating);
      }
      if (validatedData.category) {
        formDataToSubmit.append("category", validatedData.category);
      }
      if (validatedData.subcategory) {
        formDataToSubmit.append("subcategory", validatedData.subcategory);
      }
      if (validatedData.tags && validatedData.tags.length > 0) {
        formDataToSubmit.append("tags", JSON.stringify(validatedData.tags));
      }
      formDataToSubmit.append("beschrijving", validatedData.beschrijving);
      formDataToSubmit.append("afbeeldingen", JSON.stringify(validatedData.afbeeldingen));

      // Submit to server action
      await createProduct(formDataToSubmit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error && error.message.includes("EAN code")) {
        setErrors((prev) => ({ ...prev, ean: error.message }));
      } else {
        console.error("Error creating product:", error);
        alert("Er is een fout opgetreden bij het aanmaken van het product.");
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
            <h1 className="text-3xl font-bold text-gray-900">Nieuw Product</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welkom, {session.user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/admin/dashboard" />

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Informatie</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="csrf_token" value={csrfToken} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Merk */}
              <div>
                <label htmlFor="merk" className="block text-sm font-medium text-gray-700 mb-2">
                  Merk *
                </label>
                <BrandAutocomplete
                  value={formData.merk}
                  onChange={(value) => handleInputChange("merk", value)}
                  error={errors.merk || undefined}
                  placeholder="Selecteer of typ een merk..."
                />
              </div>

              {/* Productnaam */}
              <div>
                <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-2">
                  Productnaam *
                </label>
                <input
                  type="text"
                  id="naam"
                  value={formData.naam}
                  onChange={(e) => handleInputChange("naam", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.naam ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Bijv. N°5 Eau de Parfum, Sauvage Eau de Toilette"
                  maxLength={100}
                  title="Productnaam moet tussen 1 en 100 tekens zijn"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">{formData.naam.length}/100 tekens</span>
                  {errors.naam && <p className="text-sm text-red-600">{errors.naam}</p>}
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.status ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="CONCEPT">Concept</option>
                  <option value="ACTIEF">Actief</option>
                  <option value="NIET_BESCHIKBAAR">Niet Beschikbaar</option>
                  <option value="VERVALLEN">Verlopen</option>
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
              </div>

              {/* Inhoud */}
              <div>
                <label htmlFor="inhoud" className="block text-sm font-medium text-gray-700 mb-2">
                  Inhoud *
                </label>
                <div className="relative">
                  <select
                    id="inhoud"
                    value={formData.inhoud}
                    onChange={(e) => handleInputChange("inhoud", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.inhoud ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Selecteer inhoud</option>
                    <optgroup label="Kleine flessen">
                      <option value="15ml">15ml</option>
                      <option value="30ml">30ml</option>
                      <option value="50ml">50ml</option>
                      <option value="75ml">75ml</option>
                    </optgroup>
                    <optgroup label="Standaard flessen">
                      <option value="100ml">100ml</option>
                      <option value="125ml">125ml</option>
                      <option value="150ml">150ml</option>
                      <option value="200ml">200ml</option>
                    </optgroup>
                    <optgroup label="Grote flessen">
                      <option value="250ml">250ml</option>
                      <option value="500ml">500ml</option>
                      <option value="1000ml">1000ml</option>
                    </optgroup>
                    <optgroup label="Speciale formaten">
                      <option value="custom">Aangepast formaat...</option>
                    </optgroup>
                  </select>

                  {/* Custom input voor aangepaste inhoud */}
                  {formData.inhoud === "custom" && (
                    <input
                      type="text"
                      placeholder="Bijv. 90ml, 180ml, etc."
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleInputChange("inhoud", e.target.value)}
                    />
                  )}
                </div>
                {errors.inhoud && <p className="mt-1 text-sm text-red-600">{errors.inhoud}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Kies een standaard formaat of voer een aangepaste inhoud in
                </p>
              </div>

              {/* EAN Code */}
              <div>
                <label htmlFor="ean" className="block text-sm font-medium text-gray-700 mb-2">
                  EAN Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="ean"
                    value={formData.ean}
                    onChange={(e) => {
                      // Alleen cijfers toestaan
                      const value = e.target.value.replace(/\D/g, "");
                      // Maximaal 13 cijfers
                      const truncated = value.slice(0, 13);
                      handleInputChange("ean", truncated);
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ean ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="13 cijfers, bijv. 1234567890123"
                    maxLength={13}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        formData.ean.length === 13
                          ? "bg-green-100 text-green-800"
                          : formData.ean.length > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {formData.ean.length}/13
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Alleen cijfers toegestaan</span>
                  {errors.ean && <p className="text-sm text-red-600">{errors.ean}</p>}
                </div>
              </div>

              {/* Inkoopprijs */}
              <div>
                <label
                  htmlFor="inkoopprijs"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Inkoopprijs (€) *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    €
                  </div>
                  <input
                    type="text"
                    id="inkoopprijs"
                    value={formData.inkoopprijs}
                    onChange={(e) => {
                      // Alleen cijfers en punt toestaan
                      let value = e.target.value.replace(/[^\d.]/g, "");
                      // Maximaal één punt
                      const parts = value.split(".");
                      if (parts.length > 2) {
                        value = parts[0] + "." + parts.slice(1).join("");
                      }
                      // Maximaal 2 decimalen
                      if (parts.length === 2 && parts[1] && parts[1].length > 2) {
                        value = parts[0] + "." + parts[1].slice(0, 2);
                      }
                      handleInputChange("inkoopprijs", value);
                    }}
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.inkoopprijs ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    Voer bedrag in met maximaal 2 decimalen
                  </span>
                  {errors.inkoopprijs && (
                    <p className="text-sm text-red-600">{errors.inkoopprijs}</p>
                  )}
                </div>
              </div>

              {/* Verkoopprijs */}
              <div>
                <label
                  htmlFor="verkoopprijs"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Verkoopprijs (€) *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    €
                  </div>
                  <input
                    type="text"
                    id="verkoopprijs"
                    value={formData.verkoopprijs}
                    onChange={(e) => {
                      // Alleen cijfers en punt toestaan
                      let value = e.target.value.replace(/[^\d.]/g, "");
                      // Maximaal één punt
                      const parts = value.split(".");
                      if (parts.length > 2) {
                        value = parts[0] + "." + parts.slice(1).join("");
                      }
                      // Maximaal 2 decimalen
                      if (parts.length === 2 && parts[1] && parts[1].length > 2) {
                        value = parts[0] + "." + parts[1].slice(0, 2);
                      }
                      handleInputChange("verkoopprijs", value);
                    }}
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.verkoopprijs ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    Voer bedrag in met maximaal 2 decimalen
                  </span>
                  {errors.verkoopprijs && (
                    <p className="text-sm text-red-600">{errors.verkoopprijs}</p>
                  )}
                </div>
              </div>

              {/* Voorraad */}
              <div>
                <label htmlFor="voorraad" className="block text-sm font-medium text-gray-700 mb-2">
                  Voorraad *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="voorraad"
                    value={formData.voorraad}
                    onChange={(e) => {
                      // Alleen positieve gehele getallen toestaan
                      const value = e.target.value.replace(/[^\d]/g, "");
                      handleInputChange("voorraad", value);
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.voorraad ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        formData.voorraad === "0"
                          ? "bg-red-100 text-red-800"
                          : formData.voorraad === ""
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {formData.voorraad === "" ? "0" : formData.voorraad} stuks
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Alleen positieve gehele getallen</span>
                  {formData.voorraad === "0" && (
                    <span className="text-xs text-red-600">⚠️ Voorraad is 0</span>
                  )}
                  {errors.voorraad && <p className="text-sm text-red-600">{errors.voorraad}</p>}
                </div>
              </div>

              {/* Maximum bestelbare hoeveelheid */}
              <div>
                <label
                  htmlFor="maxOrderQuantity"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Maximum bestelbare hoeveelheid
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="maxOrderQuantity"
                    value={formData.maxOrderQuantity || ""}
                    onChange={(e) => {
                      // Alleen positieve gehele getallen toestaan
                      const value = e.target.value.replace(/[^\d]/g, "");
                      handleInputChange("maxOrderQuantity", value);
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxOrderQuantity ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Onbeperkt (leeg laten)"
                    min="1"
                    step="1"
                    inputMode="numeric"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        formData.maxOrderQuantity && formData.maxOrderQuantity !== ""
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {formData.maxOrderQuantity && formData.maxOrderQuantity !== ""
                        ? `${formData.maxOrderQuantity} max`
                        : "Onbeperkt"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    Optioneel - beperkt aantal per bestelling
                  </span>
                  {errors.maxOrderQuantity && (
                    <p className="text-sm text-red-600">{errors.maxOrderQuantity}</p>
                  )}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Populariteit (1-5 sterren)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleInputChange("starRating", star.toString())}
                      className={`text-2xl transition-colors ${
                        parseInt(formData.starRating || "0") >= star
                          ? "text-yellow-400 hover:text-yellow-500"
                          : "text-gray-300 hover:text-gray-400"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{formData.starRating || "0"}/5</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    Klik op sterren om populariteit in te stellen
                  </span>
                  {errors.starRating && <p className="text-sm text-red-600">{errors.starRating}</p>}
                </div>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => {
                    handleInputChange("category", e.target.value);
                    // Reset subcategory when category changes
                    if (formData.subcategory) {
                      handleInputChange("subcategory", "");
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecteer categorie</option>
                  <option value="Eau de Parfum">Eau de Parfum</option>
                  <option value="Eau de Toilette">Eau de Toilette</option>
                  <option value="Eau de Cologne">Eau de Cologne</option>
                  <option value="Parfum">Parfum</option>
                  <option value="Body Spray">Body Spray</option>
                  <option value="Gift Set">Gift Set</option>
                  <option value="Miniature">Miniature</option>
                  <option value="Travel Size">Travel Size</option>
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              {/* Subcategory */}
              <div>
                <label
                  htmlFor="subcategory"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subcategorie
                </label>
                <select
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange("subcategory", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subcategory ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={!formData.category}
                >
                  <option value="">Selecteer subcategorie</option>
                  {formData.category === "Eau de Parfum" && (
                    <>
                      <option value="Oriental">Oriental</option>
                      <option value="Floral">Floral</option>
                      <option value="Woody">Woody</option>
                      <option value="Fresh">Fresh</option>
                      <option value="Citrus">Citrus</option>
                    </>
                  )}
                  {formData.category === "Eau de Toilette" && (
                    <>
                      <option value="Sport">Sport</option>
                      <option value="Classic">Classic</option>
                      <option value="Modern">Modern</option>
                      <option value="Fresh">Fresh</option>
                    </>
                  )}
                  {formData.category === "Gift Set" && (
                    <>
                      <option value="Holiday">Holiday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Wedding">Wedding</option>
                    </>
                  )}
                </select>
                {!formData.category && (
                  <p className="mt-1 text-xs text-gray-500">Selecteer eerst een categorie</p>
                )}
                {errors.subcategory && (
                  <p className="mt-1 text-sm text-red-600">{errors.subcategory}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <TagsInput
                tags={formData.tags || []}
                onTagsChange={(tags) => handleInputChange("tags", tags)}
                placeholder="Voeg tags toe (Enter of komma)"
                maxTags={10}
              />
              {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags}</p>}
            </div>

            {/* Product Beschrijving */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="beschrijving"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Beschrijving *
                </label>
                <div className="space-y-2">
                  <textarea
                    id="beschrijving"
                    value={formData.beschrijving}
                    onChange={(e) => handleInputChange("beschrijving", e.target.value)}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.beschrijving ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Beschrijf het product in detail (minimaal 30 tekens)..."
                  />
                  <div className="text-xs text-gray-500">
                    {formData.beschrijving.length}/30 tekens (minimum)
                  </div>
                </div>
                {errors.beschrijving && (
                  <p className="mt-1 text-sm text-red-600">{errors.beschrijving}</p>
                )}
              </div>

              {/* Markdown Preview */}
              {formData.beschrijving && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: marked(formData.beschrijving),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Product Afbeeldingen */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Afbeeldingen (max. 5)
                </label>
                <ImageUpload
                  images={formData.afbeeldingen}
                  onImagesChange={(images: string[]) => handleInputChange("afbeeldingen", images)}
                  maxImages={5}
                  productId={undefined} // Will be generated for new products
                />
                {errors.afbeeldingen && (
                  <p className="mt-1 text-sm text-red-600">{errors.afbeeldingen}</p>
                )}
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Bezig met opslaan..." : "Product Aanmaken"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
