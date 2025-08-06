import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKET = "product-images";

async function fixStoragePolicies() {
  try {
    console.log("🔧 Fixing Supabase storage RLS policies...");
    console.log("URL:", supabaseUrl);
    console.log("Service Key:", supabaseServiceKey ? "Present" : "Missing");

    // First, let's check the current bucket status
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    const bucket = buckets?.find(b => b.name === STORAGE_BUCKET);
    if (!bucket) {
      console.error("❌ Bucket not found:", STORAGE_BUCKET);
      return;
    }

    console.log("✅ Bucket found:", bucket.name);
    console.log("📊 Bucket public:", bucket.public);

    // Update bucket to be public
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(STORAGE_BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (updateError) {
      console.error("❌ Error updating bucket:", updateError);
    } else {
      console.log("✅ Bucket updated to public");
    }

    // Now we need to disable RLS on the storage.objects table
    // This is typically done through the Supabase dashboard or SQL
    console.log("📝 Manual steps required:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to Storage > Policies");
    console.log("3. For the 'product-images' bucket:");
    console.log("   - Add a policy for SELECT (public read access)");
    console.log("   - Add a policy for INSERT (public upload access)");
    console.log("4. Or disable RLS entirely for this bucket");

    console.log("\n🔧 Alternative: Run this SQL in the SQL editor:");
    console.log(`
-- Disable RLS on storage.objects for the product-images bucket
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Or create specific policies:
CREATE POLICY "Public Access" ON storage.objects
FOR ALL USING (bucket_id = 'product-images');

CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');
    `);

    console.log("🎉 Storage policy fix instructions completed!");

  } catch (error) {
    console.error("❌ Setup failed:", error);
  }
}

fixStoragePolicies(); 