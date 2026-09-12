import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function isSupabaseAdminConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !supabaseUrl.includes('your-project-ref') &&
    !!supabaseServiceRoleKey &&
    !supabaseServiceRoleKey.includes('placeholder') &&
    !supabaseServiceRoleKey.includes('your-service-role-key')
  );
}

let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Returns the privileged Supabase client with service-role permissions.
 * WARNING: This client bypasses RLS and MUST ONLY be used inside protected
 * admin endpoints after authorization has been strictly verified.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[SupabaseAdmin] Service role credentials missing in backend/.env');
    return null;
  }

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdminInstance;
}
