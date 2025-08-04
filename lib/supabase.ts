import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage bucket configuration
export const STORAGE_BUCKET = "product-images";

// Image upload configuration
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxImages: 5,
  quality: 0.8, // For image optimization
};

// Generate unique filename for upload
export function generateImageFilename(originalName: string, productId: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `${productId}/${timestamp}-${randomId}.${extension}`;
}

// Validate image file
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > IMAGE_CONFIG.maxSize) {
    return {
      isValid: false,
      error: `Bestand is te groot. Maximum: ${(IMAGE_CONFIG.maxSize / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  // Check file type
  if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Alleen JPG, PNG en WebP bestanden zijn toegestaan",
    };
  }

  return { isValid: true };
}

// Upload image to Supabase Storage
export async function uploadImage(
  file: File,
  productId: string,
): Promise<{ url: string; error?: string }> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { url: "", error: validation.error };
    }

    // Generate filename
    const filename = generateImageFilename(file.name, productId);
    const filePath = `${filename}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Upload error:", error);
      return { url: "", error: "Upload mislukt. Probeer het opnieuw." };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { url: "", error: "Upload mislukt. Probeer het opnieuw." };
  }
}

// Delete image from Supabase Storage
export async function deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    const filePath = pathParts.slice(-2).join("/"); // Get productId/filename

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: "Verwijderen mislukt." };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "Verwijderen mislukt." };
  }
}
