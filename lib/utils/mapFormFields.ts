/**
 * Maps Dutch form fields to English database fields
 * This centralizes the field mapping logic to prevent runtime errors
 */

export function mapFormFieldsToDatabase(formData: FormData) {
  // ✅ Stap 3: Verbeterde EAN mapping met extra logging
  const rawEan = formData.get("ean") as string;
  const trimmedEan = rawEan?.trim();

  console.log("🔍 EAN mapping debug:", {
    rawEan,
    trimmedEan,
    rawLength: rawEan?.length,
    trimmedLength: trimmedEan?.length,
    hasSpaces: rawEan?.includes(" "),
    isEmpty: !trimmedEan,
  });

  return {
    name: (formData.get("naam") as string)?.trim(),
    description: (formData.get("beschrijving") as string)?.trim(),
    content: (formData.get("inhoud") as string)?.trim(), // Map 'inhoud' to 'content' (size/volume)
    brand: (formData.get("merk") as string)?.trim(),
    ean: trimmedEan, // ✅ Verbeterde EAN mapping
    purchasePrice: parseFloat((formData.get("inkoopprijs") as string) || "0"),
    retailPrice: parseFloat((formData.get("verkoopprijs") as string) || "0"),
    stockQuantity: parseInt((formData.get("voorraad") as string) || "0", 10), // Map to stockQuantity
    maxOrderableQuantity: null, // Optional field, not in form yet
    starRating: 0, // Default value, not in form yet
    category: null, // Optional field, not in form yet
    subcategory: null, // Optional field, not in form yet
    tags: (() => {
      const tagsData = formData.get("tags") as string;
      if (tagsData) {
        try {
          return JSON.parse(tagsData);
        } catch {
          return [];
        }
      }
      return [];
    })(),
    isActive: true, // Default value
    images: (() => {
      const imagesData = formData.get("afbeeldingen") as string;
      if (imagesData) {
        try {
          return JSON.parse(imagesData);
        } catch {
          return [];
        }
      }
      return [];
    })(),
  };
}

/**
 * Type definition for the mapped form fields
 */
export interface MappedFormFields {
  name: string | undefined;
  description: string | undefined;
  content: string | undefined; // Required field for size/volume
  brand: string | undefined;
  ean: string | undefined;
  purchasePrice: number;
  retailPrice: number;
  stockQuantity: number; // Correct field name for Prisma
  maxOrderableQuantity: number | null;
  starRating: number;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  isActive: boolean;
  images: string[];
}
