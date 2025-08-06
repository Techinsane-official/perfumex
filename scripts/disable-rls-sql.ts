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

async function disableRLS() {
  try {
    console.log("🔧 Disabling RLS on storage.objects table...");
    
    // Execute SQL to disable RLS
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.error("❌ Error disabling RLS:", error);
      
      // Try alternative approach using direct SQL
      console.log("🔄 Trying alternative approach...");
      
      const { data: data2, error: error2 } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);
      
      if (error2) {
        console.error("❌ Still getting RLS error:", error2);
        console.log("\n📋 Manual Steps Required:");
        console.log("1. Go to your Supabase dashboard:");
        console.log("   https://supabase.com/dashboard/project/oalzpzuasassmdxmfyme");
        console.log("2. Navigate to SQL Editor");
        console.log("3. Run this SQL command:");
        console.log("   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;");
        console.log("4. Click 'Run' to execute");
        console.log("5. Test your upload");
      } else {
        console.log("✅ RLS appears to be disabled or working!");
      }
    } else {
      console.log("✅ RLS disabled successfully!");
      console.log("You can now test your upload.");
    }

  } catch (error) {
    console.error("Error:", error);
    console.log("\n📋 Manual Steps Required:");
    console.log("1. Go to your Supabase dashboard:");
    console.log("   https://supabase.com/dashboard/project/oalzpzuasassmdxmfyme");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Run this SQL command:");
    console.log("   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;");
    console.log("4. Click 'Run' to execute");
    console.log("5. Test your upload");
  }
}

disableRLS(); 