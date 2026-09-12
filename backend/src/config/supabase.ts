import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !supabaseUrl.includes('your-project-ref') &&
    !!supabaseAnonKey &&
    !supabaseAnonKey.includes('your-anon-key')
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Credentials not configured or using placeholders in backend/.env');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}
