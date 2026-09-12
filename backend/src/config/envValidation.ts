/**
 * Environment Validation and Fail-Fast Enforcement
 * Ensures all critical security credentials are valid before the application accepts traffic.
 */

const INSECURE_FALLBACK_JWT_SECRET = 'gd_admin_jwt_secret_default';

export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  const jwtSecret = process.env.ADMIN_JWT_SECRET?.trim();

  // 1. JWT Secret Enforcement (Fix 1)
  if (!jwtSecret) {
    errors.push('ADMIN_JWT_SECRET environment variable is required and cannot be empty.');
  } else if (jwtSecret === INSECURE_FALLBACK_JWT_SECRET) {
    errors.push('ADMIN_JWT_SECRET is using the insecure default fallback string. A unique secret must be configured.');
  } else if (isProduction && jwtSecret.length < 32) {
    errors.push('ADMIN_JWT_SECRET must be at least 32 characters in production.');
  }

  // 2. Admin Credentials
  if (!process.env.ADMIN_EMAIL?.trim()) {
    errors.push('ADMIN_EMAIL environment variable is required.');
  }
  if (!process.env.ADMIN_PASSWORD?.trim()) {
    errors.push('ADMIN_PASSWORD environment variable is required.');
  }

  // 3. Production Hardening Assertions (Fix 11)
  if (isProduction) {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
      errors.push('Valid SUPABASE_URL is required in production.');
    }

    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
    if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
      errors.push('Valid SUPABASE_ANON_KEY is required in production.');
    }

    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseServiceRoleKey || supabaseServiceRoleKey.includes('your-service-role-key') || supabaseServiceRoleKey.includes('placeholder')) {
      errors.push('Valid SUPABASE_SERVICE_ROLE_KEY is required in production.');
    }

    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    if (!corsOrigin) {
      errors.push('CORS_ORIGIN must be explicitly configured in production.');
    }
  }

  if (errors.length > 0) {
    console.error('====================================================');
    console.error('❌ FATAL: Environment Configuration Validation Failed');
    console.error('====================================================');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    console.error('Server cannot start safely. Exiting process.');
    console.error('====================================================');
    process.exit(1);
  }
}

let _cachedAdminJwtSecret: string | null = null;

export function getAdminJwtSecret(): string {
  if (_cachedAdminJwtSecret) {
    return _cachedAdminJwtSecret;
  }
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  if (!secret || secret === INSECURE_FALLBACK_JWT_SECRET) {
    throw new Error('ADMIN_JWT_SECRET is invalid or not configured.');
  }
  _cachedAdminJwtSecret = secret;
  return _cachedAdminJwtSecret;
}
