// Supabase client configuration
// Set up your Supabase project and add credentials to .env file
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    '⚠️ Supabase credentials not found!\n' +
    'Please create a .env file with:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key'
  );
}

// Create Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_PUBLISHABLE_KEY || '',
  {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
  }
);
