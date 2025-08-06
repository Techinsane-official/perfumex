import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { uploadImage } from "../lib/supabase";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration.");
  process.exit(1);
}

async function testImageUpload() {
  try {
    console.log("Testing image upload functionality...");

    // Create a simple test image (1x1 pixel PNG)
    const pngData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testImageFile = new File([pngData], "test-image.png", { type: "image/png" });
    
    console.log("Test image file created:", {
      name: testImageFile.name,
      size: testImageFile.size,
      type: testImageFile.type
    });

    // Test upload using our uploadImage function
    const result = await uploadImage(testImageFile, "test-product");

    if (result.error) {
      console.error("Upload failed:", result.error);
      
      // Check if it's a policy issue
      if (result.error.includes("toestemming") || result.error.includes("permission")) {
        console.log("\n🔧 Storage Policy Setup Required:");
        console.log("1. Go to your Supabase dashboard");
        console.log("2. Navigate to Storage > Policies");
        console.log("3. Add these policies for 'product-images' bucket:");
        console.log("   - INSERT policy: Allow authenticated users to upload");
        console.log("   - SELECT policy: Allow public read access");
        console.log("4. Or temporarily disable RLS for testing");
      }
    } else {
      console.log("✅ Upload successful!");
      console.log("Image URL:", result.url);
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testImageUpload(); 