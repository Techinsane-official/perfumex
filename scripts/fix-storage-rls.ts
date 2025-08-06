import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration.");
  process.exit(1);
}

async function disableStorageRLS() {
  try {
    console.log("🔧 Attempting to disable RLS on storage bucket...");
    
    // Extract project ID from URL
    const projectId = supabaseUrl.split('//')[1].split('.')[0];
    console.log("Project ID:", projectId);
    
    // Use the REST API to disable RLS
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/disable_storage_rls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        bucket_name: 'product-images'
      })
    });

    if (response.ok) {
      console.log("✅ RLS disabled successfully!");
    } else {
      console.log("❌ Failed to disable RLS via API");
      console.log("Status:", response.status);
      console.log("Response:", await response.text());
      
      // Alternative approach - try to create a policy that allows all operations
      console.log("\n🔄 Trying alternative approach...");
      
      const policyResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/create_storage_policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          bucket_name: 'product-images',
          policy_name: 'allow_all',
          operation: 'ALL',
          roles: ['public', 'authenticated']
        })
      });
      
      if (policyResponse.ok) {
        console.log("✅ Storage policy created successfully!");
      } else {
        console.log("❌ Failed to create policy via API");
        console.log("Status:", policyResponse.status);
        console.log("Response:", await policyResponse.text());
      }
    }

  } catch (error) {
    console.error("Error:", error);
    console.log("\n📋 Manual Steps Required:");
    console.log("1. Go to your Supabase dashboard:");
    console.log("   https://supabase.com/dashboard/project/oalzpzuasassmdxmfyme");
    console.log("2. Navigate to Storage > Policies");
    console.log("3. Find the 'product-images' bucket");
    console.log("4. Toggle off RLS temporarily");
    console.log("5. Test your upload");
  }
}

disableStorageRLS(); 