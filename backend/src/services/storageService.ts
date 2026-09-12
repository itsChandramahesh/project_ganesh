import crypto from 'crypto';
import { getSupabaseAdminClient } from '../config/supabaseAdmin.js';
import type { Mandapam } from '../types/mandapam.js';

export const BUCKET_NAME = 'mandapam-images';

/**
 * Checks if an image_url string represents a Supabase Storage path.
 * Format: "submissions/<uuid>.<ext>"
 */
export function isSupabaseStoragePath(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('submissions/') &&
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://')
  );
}

/**
 * Uploads an image buffer to the private Supabase Storage bucket.
 * Returns the relative storage path (e.g. "submissions/<uuid>.<ext>").
 */
export async function uploadMandapamImage(
  buffer: Buffer,
  contentType: string,
  extension: string
): Promise<string> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    throw new Error('Supabase admin client is not configured.');
  }

  const cleanExt = extension.replace(/^\./, '').toLowerCase() || 'jpg';
  const uniqueId = crypto.randomUUID();
  const filename = `${uniqueId}.${cleanExt}`;
  const storagePath = `submissions/${filename}`;

  const resolvedContentType =
    contentType || `image/${cleanExt === 'jpg' ? 'jpeg' : cleanExt}`;

  const { data, error } = await adminClient.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: resolvedContentType,
      upsert: false,
    });

  if (error || !data) {
    throw new Error(
      `Failed to upload to Supabase Storage: ${error?.message || 'Unknown error'}`
    );
  }

  return storagePath;
}

/**
 * Creates a short-lived signed URL (default 5 minutes) for a private Supabase Storage object.
 */
export async function createMandapamSignedUrl(
  storagePath: string,
  expiresIn = 300
): Promise<string | null> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return null;
  }

  let cleanPath = storagePath.trim().replace(/^\/+/, '');
  if (cleanPath.startsWith(`${BUCKET_NAME}/`)) {
    cleanPath = cleanPath.slice(`${BUCKET_NAME}/`.length);
  }

  try {
    const { data, error } = await adminClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cleanPath, expiresIn);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Deletes an image from the private Supabase Storage bucket.
 */
export async function deleteMandapamImage(storagePath: string): Promise<boolean> {
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return false;
  }

  let cleanPath = storagePath.trim().replace(/^\/+/, '');
  if (cleanPath.startsWith(`${BUCKET_NAME}/`)) {
    cleanPath = cleanPath.slice(`${BUCKET_NAME}/`.length);
  }

  // Safety check: ensure only objects within the submissions/ prefix are deleted
  if (!cleanPath.startsWith('submissions/')) {
    console.warn(
      `[storageService] Refusing to delete storage object outside submissions/: ${cleanPath}`
    );
    return false;
  }

  try {
    const { error } = await adminClient.storage
      .from(BUCKET_NAME)
      .remove([cleanPath]);

    if (error) {
      console.warn(`[storageService] Error removing storage object: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[storageService] Exception deleting storage object:', err);
    return false;
  }
}

/**
 * Resolves any image_url into a web-accessible URL.
 * - If Supabase Storage path: generates a real signed URL (5-min expiry).
 * - If local URL (/api/uploads/...): returns as-is.
 * - If external URL (https://...): returns as-is.
 * - If null/empty: returns null.
 */
export async function resolveImageUrl(
  imageUrl: string | null | undefined,
  expiresIn = 300
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return null;
  }

  // 1. External absolute URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Local uploads served by Express static
  if (trimmed.startsWith('/api/uploads/') || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // 3. Supabase Storage object path (e.g. submissions/<uuid>.<ext>)
  if (isSupabaseStoragePath(trimmed)) {
    const signed = await createMandapamSignedUrl(trimmed, expiresIn);
    return signed;
  }

  return trimmed;
}

/**
 * Resolves image_url for a single Mandapam record.
 */
export async function resolveMandapamImages(mandapam: Mandapam): Promise<Mandapam> {
  if (!mandapam.image_url) {
    return { ...mandapam };
  }
  const resolved = await resolveImageUrl(mandapam.image_url);
  return {
    ...mandapam,
    image_url: resolved,
  };
}

/**
 * Concurrently resolves image_urls for an array of Mandapam records.
 */
export async function resolveMandapamsImages(
  mandapams: Mandapam[]
): Promise<Mandapam[]> {
  return Promise.all(mandapams.map((m) => resolveMandapamImages(m)));
}
