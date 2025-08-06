import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create client with anon key (like the frontend)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
// Create client with service key (for admin operations)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testUploadPolicies() {
  try {
    console.log('Testing upload policies...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Project ID:', supabaseUrl.split('//')[1].split('.')[0]);

    // Test 1: Check if bucket exists and is accessible
    console.log('\n1. Checking bucket accessibility...');
    const { data: buckets, error: bucketError } = await supabaseService.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return;
    }

    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found');
      return;
    }

    console.log('✅ product-images bucket found');
    console.log('Bucket public:', productImagesBucket.public);
    console.log('Bucket file size limit:', productImagesBucket.file_size_limit);

    // Test 2: Check current policies
    console.log('\n2. Checking current policies...');
    const { data: policies, error: policyError } = await supabaseService.rpc('get_storage_policies', { bucket_name: 'product-images' });
    
    if (policyError) {
      console.log('⚠️  Could not fetch policies (this is normal):', policyError.message);
    } else {
      console.log('Current policies:', policies);
    }

    // Test 3: Try to upload with anon key (simulating frontend)
    console.log('\n3. Testing upload with anon key...');
    const testFile = new File(['test image content'], 'test.png', { type: 'image/png' });
    
    const { data: uploadData, error: uploadError } = await supabaseAnon.storage
      .from('product-images')
      .upload('test/test-upload.png', testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed with anon key:', uploadError);
      console.log('Error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        details: uploadError.details
      });
    } else {
      console.log('✅ Upload successful with anon key');
      console.log('Upload data:', uploadData);
      
      // Clean up test file
      await supabaseAnon.storage.from('product-images').remove(['test/test-upload.png']);
    }

    // Test 4: Try to upload with service key (admin)
    console.log('\n4. Testing upload with service key...');
    const { data: serviceUploadData, error: serviceUploadError } = await supabaseService.storage
      .from('product-images')
      .upload('test/test-service-upload.png', testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (serviceUploadError) {
      console.error('❌ Upload failed with service key:', serviceUploadError);
    } else {
      console.log('✅ Upload successful with service key');
      console.log('Service upload data:', serviceUploadData);
      
      // Clean up test file
      await supabaseService.storage.from('product-images').remove(['test/test-service-upload.png']);
    }

    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Make sure the bucket is set to "public" in Supabase dashboard');
    console.log('2. Verify all 4 policies are correctly added:');
    console.log('   - INSERT: Allow authenticated uploads');
    console.log('   - SELECT: Allow public downloads');
    console.log('   - UPDATE: Allow authenticated updates');
    console.log('   - DELETE: Allow authenticated deletes');
    console.log('3. Check that the user is properly authenticated when uploading');
    console.log('4. Try temporarily disabling RLS to test if policies are the issue');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUploadPolicies(); 