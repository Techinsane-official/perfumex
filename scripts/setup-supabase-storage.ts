import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration. Please check your environment variables.");
  console.log("Supabase URL:", supabaseUrl ? "Present" : "Missing");
  console.log("Service Key:", supabaseServiceKey ? "Present" : "Missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log("Setting up Supabase storage...");
    console.log("Supabase URL:", supabaseUrl);

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === "product-images");
    
    if (!bucketExists) {
      console.log("Creating storage bucket 'product-images'...");
      
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket("product-images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        fileSizeLimit: 5242880, // 5MB
      });

      if (bucketError) {
        console.error("Error creating storage bucket:", bucketError);
        return;
      } else {
        console.log("Storage bucket 'product-images' created successfully.");
      }
    } else {
      console.log("Storage bucket 'product-images' already exists.");
    }

    // Test upload and download
    console.log("Testing storage functionality...");
    
    // Create a test file
    const testFile = new Blob(["test"], { type: "text/plain" });
    const testFileName = `test-${Date.now()}.txt`;
    
    // Test upload
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error("Upload test failed:", uploadError);
      console.log("This might be due to missing storage policies.");
      console.log("Please check your Supabase dashboard:");
      console.log("1. Go to Storage > Policies");
      console.log("2. Add a policy for 'product-images' bucket");
      console.log("3. Policy should allow INSERT for authenticated users");
      console.log("4. Policy should allow SELECT for public access");
    } else {
      console.log("Upload test successful!");
      
      // Test download
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from("product-images")
        .download(testFileName);

      if (downloadError) {
        console.error("Download test failed:", downloadError);
      } else {
        console.log("Download test successful!");
      }

      // Clean up test file
      await supabase.storage.from("product-images").remove([testFileName]);
    }

    console.log("✅ Supabase storage setup completed successfully!");
    console.log("You can now upload images to the 'product-images' bucket.");

  } catch (error) {
    console.error("Error setting up storage:", error);
  }
}

setupStorage(); 