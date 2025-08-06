import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKET = "product-images";

async function setupStorage() {
  try {
    console.log("🔍 Checking Supabase storage configuration...");

    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Error listing buckets:", bucketsError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      console.log("📦 Creating storage bucket...");
      
      const { data: bucket, error: createError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        console.error("❌ Error creating bucket:", createError);
        return;
      }

      console.log("✅ Storage bucket created successfully");
    } else {
      console.log("✅ Storage bucket already exists");
    }

    // Set bucket policies for public access
    console.log("🔐 Setting up bucket policies...");
    
    // Policy for public read access
    const { error: readPolicyError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createPolicy('public-read', {
      name: 'Public Read Access',
      definition: 'SELECT',
      check: 'true'
    });

    if (readPolicyError && !readPolicyError.message.includes('already exists')) {
      console.error("❌ Error setting read policy:", readPolicyError);
    } else {
      console.log("✅ Read policy set");
    }

    // Policy for authenticated uploads
    const { error: uploadPolicyError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createPolicy('authenticated-upload', {
      name: 'Authenticated Upload',
      definition: 'INSERT',
      check: 'auth.role() = \'authenticated\' OR auth.role() = \'anon\''
    });

    if (uploadPolicyError && !uploadPolicyError.message.includes('already exists')) {
      console.error("❌ Error setting upload policy:", uploadPolicyError);
    } else {
      console.log("✅ Upload policy set");
    }

    console.log("🎉 Supabase storage setup completed successfully!");
    console.log(`📁 Bucket: ${STORAGE_BUCKET}`);
    console.log("🔗 Public URL format: https://[project].supabase.co/storage/v1/object/public/product-images/[file-path]");

  } catch (error) {
    console.error("❌ Setup failed:", error);
  }
}

setupStorage(); 