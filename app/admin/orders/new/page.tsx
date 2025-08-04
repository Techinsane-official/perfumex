"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import BackButton from "@/components/ui/BackButton";
import { createOrder } from "./actions";

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

type OrderFormData = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<OrderFormData>({
    klantnaam: "",
    producten: "",
    totaalbedrag: "",
    status: "PENDING",
    opmerkingen: "",
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user as Record<string, unknown>)?.role !== "ADMIN") {
    return null;
  }

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev: OrderFormData) => ({ ...prev, [field]: value }));
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
      const validatedData = orderSchema.parse(formData);

      // Validate totaalbedrag
      const bedragNum = parseFloat(validatedData.totaalbedrag);
      if (bedragNum <= 0) {
        setErrors({ totaalbedrag: "Totaalbedrag moet groter zijn dan 0" });
        return;
      }

      // Create FormData for server action
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("klantnaam", validatedData.klantnaam);
      formDataToSubmit.append("producten", validatedData.producten);
      formDataToSubmit.append("totaalbedrag", validatedData.totaalbedrag);
      formDataToSubmit.append("status", validatedData.status);
      formDataToSubmit.append("opmerkingen", validatedData.opmerkingen || "");

      // Submit to server action
      await createOrder(formDataToSubmit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error("Error creating order:", error);
        alert("Er is een fout opgetreden bij het aanmaken van de order.");
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
            <h1 className="text-3xl font-bold text-gray-900">Nieuwe Order</h1>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Informatie</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Klantnaam */}
              <div>
                <label htmlFor="klantnaam" className="block text-sm font-medium text-gray-700 mb-1">
                  Klantnaam *
                </label>
                <input
                  type="text"
                  id="klantnaam"
                  value={formData.klantnaam}
                  onChange={(e) => handleInputChange("klantnaam", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.klantnaam ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Bijv. Parfumrijk B.V."
                />
                {errors.klantnaam && (
                  <p className="mt-1 text-sm text-red-600">{errors.klantnaam}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <option value="PENDING">In behandeling</option>
                  <option value="APPROVED">Goedgekeurd</option>
                  <option value="REJECTED">Afgewezen</option>
                  <option value="CANCELLED">Geannuleerd</option>
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
              </div>

              {/* Producten */}
              <div className="md:col-span-2">
                <label htmlFor="producten" className="block text-sm font-medium text-gray-700 mb-1">
                  Producten *
                </label>
                <textarea
                  id="producten"
                  value={formData.producten}
                  onChange={(e) => handleInputChange("producten", e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.producten ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Bijv. Chanel N°5 100ml x2, Dior J'adore 75ml x1"
                />
                {errors.producten && (
                  <p className="mt-1 text-sm text-red-600">{errors.producten}</p>
                )}
              </div>

              {/* Totaalbedrag */}
              <div>
                <label
                  htmlFor="totaalbedrag"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Totaalbedrag (€) *
                </label>
                <input
                  type="text"
                  id="totaalbedrag"
                  value={formData.totaalbedrag}
                  onChange={(e) => handleInputChange("totaalbedrag", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.totaalbedrag ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Bijv. 245.50"
                />
                {errors.totaalbedrag && (
                  <p className="mt-1 text-sm text-red-600">{errors.totaalbedrag}</p>
                )}
              </div>

              {/* Opmerkingen */}
              <div>
                <label
                  htmlFor="opmerkingen"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Opmerkingen
                </label>
                <textarea
                  id="opmerkingen"
                  value={formData.opmerkingen}
                  onChange={(e) => handleInputChange("opmerkingen", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionele opmerkingen..."
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Bezig met opslaan..." : "Order Aanmaken"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
