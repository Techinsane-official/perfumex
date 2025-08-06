import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStoragePolicies() {
  try {
    console.log('Setting up storage policies for product-images bucket...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Project ID:', supabaseUrl.split('//')[1].split('.')[0]);

    // SQL commands to create storage policies
    const policies = [
      // Policy for INSERT (upload) - allow authenticated users to upload
      `
      CREATE POLICY "Allow authenticated uploads" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND
        auth.role() = 'authenticated'
      );
      `,
      
      // Policy for SELECT (download/view) - allow public access to view images
      `
      CREATE POLICY "Allow public downloads" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'product-images'
      );
      `,
      
      // Policy for UPDATE - allow authenticated users to update their uploads
      `
      CREATE POLICY "Allow authenticated updates" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'product-images' AND
        auth.role() = 'authenticated'
      );
      `,
      
      // Policy for DELETE - allow authenticated users to delete their uploads
      `
      CREATE POLICY "Allow authenticated deletes" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'product-images' AND
        auth.role() = 'authenticated'
      );
      `
    ];

    console.log('Adding storage policies...');

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      console.log(`Adding policy ${i + 1}/${policies.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      
      if (error) {
        console.log(`Policy ${i + 1} error (might already exist):`, error.message);
      } else {
        console.log(`✅ Policy ${i + 1} added successfully`);
      }
    }

    console.log('🎉 Storage policies setup completed!');
    console.log('');
    console.log('📋 Manual verification steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > product-images');
    console.log('3. Click on "Policies" tab');
    console.log('4. Verify these policies exist:');
    console.log('   - Allow authenticated uploads');
    console.log('   - Allow public downloads');
    console.log('   - Allow authenticated updates');
    console.log('   - Allow authenticated deletes');
    console.log('');
    console.log('If policies are not visible, you may need to add them manually in the dashboard.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('');
    console.log('🔧 Manual setup instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > product-images');
    console.log('3. Click on "Policies" tab');
    console.log('4. Add these policies manually:');
    console.log('');
    console.log('INSERT Policy:');
    console.log('- Name: "Allow authenticated uploads"');
    console.log('- Target roles: authenticated');
    console.log('- Using expression: bucket_id = \'product-images\' AND auth.role() = \'authenticated\'');
    console.log('');
    console.log('SELECT Policy:');
    console.log('- Name: "Allow public downloads"');
    console.log('- Target roles: anon, authenticated');
    console.log('- Using expression: bucket_id = \'product-images\'');
    console.log('');
    console.log('UPDATE Policy:');
    console.log('- Name: "Allow authenticated updates"');
    console.log('- Target roles: authenticated');
    console.log('- Using expression: bucket_id = \'product-images\' AND auth.role() = \'authenticated\'');
    console.log('');
    console.log('DELETE Policy:');
    console.log('- Name: "Allow authenticated deletes"');
    console.log('- Target roles: authenticated');
    console.log('- Using expression: bucket_id = \'product-images\' AND auth.role() = \'authenticated\'');
  }
}

setupStoragePolicies(); 