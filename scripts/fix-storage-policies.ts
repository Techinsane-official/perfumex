import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  try {
    console.log("🔧 Setting up storage policies...");

    // First, let's check if we can access the bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return;
    }

    console.log("Available buckets:", buckets?.map(b => b.name));

    // Try to disable RLS temporarily for testing
    console.log("Attempting to disable RLS for product-images bucket...");
    
    // Note: The client library doesn't support modifying RLS policies directly
    // We need to use the dashboard or REST API
    
    console.log("\n📋 Manual Steps Required:");
    console.log("1. Go to your Supabase dashboard:");
    console.log("   https://supabase.com/dashboard/project/oalzpzuasassmdxmfyme");
    console.log("2. Navigate to Storage > Policies");
    console.log("3. Find the 'product-images' bucket");
    console.log("4. Toggle off RLS temporarily");
    console.log("5. Test your upload");
    console.log("6. Re-enable RLS and add these policies:");
    console.log("   - SELECT policy for 'public' role");
    console.log("   - INSERT policy for 'authenticated' role");
    console.log("   - DELETE policy for 'authenticated' role");

    // Test if we can upload with current settings
    console.log("\n🧪 Testing current upload capability...");
    
    const testFile = new File(["test"], "test.txt", { type: "text/plain" });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(`test-${Date.now()}.txt`, testFile);

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError.message);
      console.log("This confirms RLS is blocking uploads.");
    } else {
      console.log("✅ Upload test successful!");
      // Clean up test file
      await supabase.storage.from("product-images").remove([uploadData.path]);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

fixStoragePolicies(); 