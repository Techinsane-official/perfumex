import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use anon key for testing (same as client)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKET = "product-images";

// Generate unique filename for upload
function generateImageFilename(originalName: string, productId: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `${productId}/${timestamp}-${randomId}.${extension}`;
}

// Validate image file
function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Bestand is te groot. Maximum: ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Alleen JPG, PNG en WebP bestanden zijn toegestaan",
    };
  }

  return { isValid: true };
}

// Upload image to Supabase Storage
async function uploadImage(
  file: File,
  productId: string,
): Promise<{ url: string; error?: string }> {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { url: "", error: validation.error || "Validatie fout" };
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
        name: error.name
      });
      
      // Provide more specific error messages
      if (error.message?.includes("bucket") || error.message?.includes("not found")) {
        return { url: "", error: "Opslag bucket niet gevonden. Neem contact op met de beheerder." };
      } else if (error.message?.includes("permission") || error.message?.includes("403")) {
        return { url: "", error: "Geen toestemming voor upload. Controleer uw rechten." };
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        return { url: "", error: "Netwerkfout. Controleer uw internetverbinding." };
      } else if (error.message?.includes("size") || error.message?.includes("413")) {
        return { url: "", error: "Bestand is te groot voor upload." };
      } else if (error.message?.includes("type") || error.message?.includes("415")) {
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

async function testUpload() {
  try {
    console.log("🧪 Testing image upload functionality...");
    console.log("URL:", supabaseUrl);
    console.log("Anon Key:", supabaseAnonKey ? "Present" : "Missing");

    // Create a test file (1x1 pixel PNG)
    const testImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    
    // Convert base64 to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();
    
    // Create a File object
    const testFile = new File([blob], "test-image.png", { type: "image/png" });

    console.log("📁 Test file created:", {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    // Test upload
    const result = await uploadImage(testFile, "test-product-123");

    if (result.error) {
      console.error("❌ Upload failed:", result.error);
      return;
    }

    console.log("✅ Upload successful!");
    console.log("🔗 URL:", result.url);

    // Test if the URL is accessible
    try {
      const imageResponse = await fetch(result.url);
      if (imageResponse.ok) {
        console.log("✅ Image URL is accessible");
      } else {
        console.log("⚠️ Image URL returned status:", imageResponse.status);
      }
    } catch (error) {
      console.log("⚠️ Could not verify image URL accessibility:", error);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testUpload(); 