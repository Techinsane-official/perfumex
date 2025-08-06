import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleUpload() {
  try {
    console.log('Testing simple upload...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Create a simple test file
    const testFile = new File(['test image content'], 'test.png', { type: 'image/png' });
    
    console.log('Attempting upload with anon key...');
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload('test/simple-test.png', testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      console.log('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details
      });
      
      console.log('\n🔧 Suggested fixes:');
      console.log('1. Try temporarily disabling RLS in Supabase dashboard');
      console.log('2. Or update policies to be more permissive');
      console.log('3. Check if user authentication is required');
      
    } else {
      console.log('✅ Upload successful!');
      console.log('Upload data:', data);
      
      // Clean up
      await supabase.storage.from('product-images').remove(['test/simple-test.png']);
      console.log('✅ Test file cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleUpload(); 