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

// Check if storage bucket exists and is accessible
export async function checkStorageBucket(): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
    
    if (error) {
      console.error("Storage bucket check error:", error);
      return { exists: false, error: error.message };
    }
    
    return { exists: true };
  } catch (error) {
    console.error("Storage bucket check failed:", error);
    return { exists: false, error: "Kan opslag bucket niet controleren" };
  }
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

    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration missing");
      return { url: "", error: "Upload configuratie ontbreekt. Neem contact op met de beheerder." };
    }

    // Generate filename
    const filename = generateImageFilename(file.name, productId);
    const filePath = `${filename}`;

    console.log("Attempting upload:", {
      bucket: STORAGE_BUCKET,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      productId,
      supabaseUrl: supabaseUrl ? "Present" : "Missing",
      supabaseKey: supabaseAnonKey ? "Present" : "Missing"
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Upload error details:", {
        error,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        name: error.name
      });
      
      // Provide more specific error messages
      if (error.message?.includes("bucket") || error.message?.includes("not found")) {
        return { url: "", error: "Opslag bucket niet gevonden. Neem contact op met de beheerder." };
      } else if (error.message?.includes("permission") || error.statusCode === 403) {
        return { url: "", error: "Geen toestemming voor upload. Controleer uw rechten." };
      } else if (error.message?.includes("network") || error.statusCode === 0) {
        return { url: "", error: "Netwerkfout. Controleer uw internetverbinding." };
      } else if (error.message?.includes("size") || error.statusCode === 413) {
        return { url: "", error: "Bestand is te groot voor upload." };
      } else if (error.message?.includes("type") || error.statusCode === 415) {
        return { url: "", error: "Bestandstype niet ondersteund. Alleen JPG, PNG en WebP toegestaan." };
      } else {
        return { url: "", error: `Upload mislukt: ${error.message || "Onbekende fout"}` };
      }
    }

    if (!data) {
      console.error("No data returned from upload");
      return { url: "", error: "Upload mislukt: Geen data ontvangen" };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error("Failed to get public URL for uploaded file");
      return { url: "", error: "Upload voltooid maar URL kon niet worden opgehaald" };
    }

    console.log("Upload successful:", urlData.publicUrl);
    return { url: urlData.publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    
    // Handle specific error types
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return { url: "", error: "Netwerkfout. Controleer uw internetverbinding." };
    } else if (error instanceof Error) {
      return { url: "", error: `Upload mislukt: ${error.message}` };
    } else {
      return { url: "", error: "Upload mislukt. Probeer het opnieuw." };
    }
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
