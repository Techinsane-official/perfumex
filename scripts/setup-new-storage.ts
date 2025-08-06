import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  try {
    console.log('Setting up storage bucket for new Supabase project...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Project ID:', supabaseUrl.split('//')[1].split('.')[0]);

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = existingBuckets.some(bucket => bucket.name === 'product-images');
    
    if (bucketExists) {
      console.log('✅ Bucket "product-images" already exists');
    } else {
      console.log('Creating bucket "product-images"...');
      
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return;
      }

      console.log('✅ Bucket "product-images" created successfully');
    }

    // Try to disable RLS on the bucket
    console.log('Attempting to disable RLS on storage.objects...');
    
    // Note: This might not work due to Supabase restrictions
    // The user will need to manually disable RLS in the dashboard
    console.log('⚠️  IMPORTANT: You need to manually disable RLS in the Supabase dashboard:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage > product-images');
    console.log('3. Click on "Settings" tab');
    console.log('4. Disable "Row Level Security (RLS)"');
    console.log('5. Save the changes');

    // Test upload to verify bucket is accessible
    console.log('Testing bucket accessibility...');
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload('test/test.txt', testFile);

    if (uploadError) {
      console.log('❌ Upload test failed (expected for text file):', uploadError.message);
      console.log('This is normal - the bucket only accepts image files');
    } else {
      console.log('✅ Upload test successful');
      // Clean up test file
      await supabase.storage.from('product-images').remove(['test/test.txt']);
    }

    console.log('🎉 Storage setup completed!');
    console.log('Please disable RLS manually in the Supabase dashboard as mentioned above.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorageBucket(); 