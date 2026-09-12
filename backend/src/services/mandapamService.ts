import crypto from 'crypto';
import { getSupabaseClient } from '../config/supabase.js';
import { getSupabaseAdminClient } from '../config/supabaseAdmin.js';
import { localStore } from './localStore.js';
import type { Mandapam, MandapamStatus } from '../types/mandapam.js';
import {
  uploadMandapamImage,
  deleteMandapamImage,
  resolveImageUrl,
  resolveMandapamImages,
  resolveMandapamsImages,
  isSupabaseStoragePath,
} from './storageService.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MandapamServiceError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MandapamServiceError';
    this.status = status;
  }
}

type MandapamSubmissionInput = {
  name: string;
  area: string;
  address?: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  submitted_by?: string | null;
};

type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

/**
 * Executes a promise with a strict timeout to prevent slow/blocked network requests
 * (such as ISP TLS connection resets to Supabase) from hanging the application.
 */
async function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Database operation timed out')), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

function getDbClient() {
  return getSupabaseAdminClient() ?? getSupabaseClient();
}

function getPublicDbClient() {
  return getSupabaseClient();
}

/**
 * List all approved mandapams with optional area & text search filters.
 * Seamlessly uses local storage if Supabase is offline or unreachable.
 */
export async function listApprovedMandapams(
  area?: string,
  search?: string
): Promise<Mandapam[]> {
  const localData = await localStore.getApproved(area, search);

  const supabase = getPublicDbClient();
  if (!supabase) {
    return localData;
  }

  try {
    let query = supabase
      .from('mandapams')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (area && area !== 'all') {
      query = query.eq('area', area);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `name.ilike.${term},area.ilike.${term},address.ilike.${term}`
      );
    }

    const { data, error } = await withTimeout(Promise.resolve(query), 800);

    if (error || !data || data.length === 0) {
      return resolveMandapamsImages(localData);
    }

    // Merge Supabase items with local items (avoiding duplicates by id)
    const localIds = new Set(localData.map((m) => m.id));
    const remoteItems = (data as Mandapam[]).filter((m) => !localIds.has(m.id));
    return resolveMandapamsImages([...localData, ...remoteItems]);
  } catch (err) {
    // Network socket disconnected or timeout - return local store gracefully
    return resolveMandapamsImages(localData);
  }
}

/**
 * Returns featured mandapams, falling back to recent approved if none featured.
 */
export async function listFeaturedMandapams(): Promise<Mandapam[]> {
  const localFeatured = await localStore.getFeatured();

  const supabase = getPublicDbClient();
  if (!supabase) {
    return localFeatured;
  }

  try {
    const { data: featured, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from('mandapams')
          .select('*')
          .eq('status', 'approved')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
      ),
      800
    );

    if (error || !featured || featured.length === 0) {
      return resolveMandapamsImages(localFeatured);
    }

    return resolveMandapamsImages(featured as Mandapam[]);
  } catch {
    return resolveMandapamsImages(localFeatured);
  }
}

/**
 * Fetches a single approved mandapam by UUID.
 */
export async function getMandapamById(id: string): Promise<Mandapam> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format');
  }

  const localItem = await localStore.getById(id);
  if (localItem && localItem.status === 'approved') {
    return resolveMandapamImages(localItem);
  }

  const supabase = getPublicDbClient();
  if (!supabase) {
    throw new MandapamServiceError(404, 'Mandapam not found');
  }

  try {
    const { data, error } = await withTimeout(
      Promise.resolve(
        supabase
          .from('mandapams')
          .select('*')
          .eq('id', id)
          .eq('status', 'approved')
          .maybeSingle()
      ),
      800
    );

    if (error || !data) {
      throw new MandapamServiceError(404, 'Mandapam not found');
    }

    return resolveMandapamImages(data as Mandapam);
  } catch (error) {
    if (error instanceof MandapamServiceError) throw error;
    throw new MandapamServiceError(404, 'Mandapam not found');
  }
}

/**
 * Creates a new mandapam submission.
 * Saves uploaded image to local storage, persists record to local storage,
 * and auto-approves by default so it immediately appears in Explore.
 */
export async function createMandapamSubmission(
  payload: MandapamSubmissionInput,
  file?: UploadedFile
): Promise<Mandapam> {
  let storedImagePath: string | null = null;

  if (file) {
    const rawExt = file.originalname.split('.').pop()?.toLowerCase() || '';
    const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      throw new MandapamServiceError(
        400,
        'Only image files with extensions .jpg, .jpeg, .png, or .webp are allowed.'
      );
    }

    // Try Supabase Storage upload first
    try {
      storedImagePath = await uploadMandapamImage(file.buffer, file.mimetype, rawExt);
    } catch (storageErr) {
      console.warn(
        '[mandapamService] Supabase Storage upload failed, falling back to localStore:',
        storageErr instanceof Error ? storageErr.message : 'Unknown error'
      );
      try {
        storedImagePath = await localStore.saveUploadedFile(file.buffer, file.originalname);
      } catch (err) {
        console.error('[mandapamService] Error saving uploaded file to localStore:', err);
        throw new MandapamServiceError(500, 'Failed to process uploaded photo.');
      }
    }
  }

  // Every new public submission must ALWAYS start in 'pending' moderation status
  const newMandapam: Mandapam = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    area: payload.area.trim(),
    address: payload.address?.trim() || null,
    description: payload.description?.trim() || null,
    latitude: payload.latitude,
    longitude: payload.longitude,
    image_url: storedImagePath,
    status: 'pending',
    is_featured: false,
    is_verified: false,
    submitted_by: payload.submitted_by?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Always save locally first so user's submission is never lost
  const createdRecord = await localStore.insert(newMandapam);

  // Safely attempt background push to Supabase if configured and reachable
  const supabase = getPublicDbClient();
  if (supabase) {
    (async () => {
      try {
        await withTimeout(
          Promise.resolve(
            supabase.from('mandapams').insert({
              id: newMandapam.id,
              name: newMandapam.name,
              area: newMandapam.area,
              address: newMandapam.address,
              description: newMandapam.description,
              latitude: newMandapam.latitude,
              longitude: newMandapam.longitude,
              image_url: newMandapam.image_url,
              status: newMandapam.status,
              is_featured: newMandapam.is_featured,
              is_verified: newMandapam.is_verified,
              submitted_by: newMandapam.submitted_by,
            })
          ),
          2500
        );
      } catch {
        // Supabase network error is safely caught and ignored
      }
    })();
  }

  return resolveMandapamImages(createdRecord);
}

/**
 * Admin: List mandapams with optional status filter.
 */
export async function listAdminMandapams(status?: string): Promise<Mandapam[]> {
  const allItems = await localStore.getAll();
  const validStatus = status && status !== 'all' ? status : undefined;

  let result = validStatus ? allItems.filter((m) => m.status === validStatus) : allItems;
  const sorted = result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return resolveMandapamsImages(sorted);
}

/**
 * Admin: Fetch single mandapam by UUID with signed or direct image URL.
 */
export async function getAdminMandapamById(
  id: string
): Promise<Mandapam & { signed_image_url?: string | null }> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.');
  }

  const mandapam = await localStore.getById(id);
  if (!mandapam) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  const signedUrl = await resolveImageUrl(mandapam.image_url, 300);

  return {
    ...mandapam,
    signed_image_url: signedUrl,
  };
}

/**
 * Admin: Update mandapam details.
 */
export async function updateMandapam(
  id: string,
  updates: Record<string, unknown>
): Promise<Mandapam> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.');
  }

  const updated = await localStore.update(id, updates as Partial<Mandapam>);
  if (!updated) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  const supabase = getDbClient();
  if (supabase) {
    withTimeout(
      Promise.resolve(supabase.from('mandapams').update(updates).eq('id', id)),
      2000
    ).catch(() => {});
  }

  return updated;
}

/**
 * Admin: Approve a pending mandapam.
 */
export async function approveMandapam(id: string): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.');
  }

  const updated = await localStore.update(id, { status: 'approved' });
  if (!updated) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  const supabase = getDbClient();
  if (supabase) {
    withTimeout(
      Promise.resolve(
        supabase
          .from('mandapams')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', id)
      ),
      2000
    ).catch(() => {});
  }
}

/**
 * Admin: Reject a mandapam.
 */
export async function rejectMandapam(id: string): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.');
  }

  const updated = await localStore.update(id, { status: 'rejected' });
  if (!updated) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  const supabase = getDbClient();
  if (supabase) {
    withTimeout(
      Promise.resolve(
        supabase
          .from('mandapams')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', id)
      ),
      2000
    ).catch(() => {});
  }
}

/**
 * Admin: Toggle boolean flags (is_verified / is_featured).
 */
export async function setMandapamBooleanFlag(
  id: string,
  field: 'is_verified' | 'is_featured',
  value: boolean
): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.');
  }

  const updated = await localStore.update(id, { [field]: value });
  if (!updated) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  const supabase = getDbClient();
  if (supabase) {
    withTimeout(
      Promise.resolve(
        supabase
          .from('mandapams')
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq('id', id)
      ),
      2000
    ).catch(() => {});
  }
}

/**
 * Admin: Delete a mandapam record.
 */
export async function deleteMandapam(id: string): Promise<void> {
  if (!UUID_REGEX.test(id)) {
    throw new MandapamServiceError(400, 'Invalid mandapam ID format.');
  }

  const mandapam = await localStore.getById(id);
  if (!mandapam) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  // 1. Delete image from Supabase Storage if it was uploaded to Supabase
  if (mandapam.image_url && isSupabaseStoragePath(mandapam.image_url)) {
    await deleteMandapamImage(mandapam.image_url).catch((err) => {
      console.warn(
        '[mandapamService] Failed to delete Supabase storage object:',
        err?.message || err
      );
    });
  }

  // 2. Delete from localStore (also cleans up local filesystem if starts with /api/uploads/)
  const deleted = await localStore.delete(id);
  if (!deleted) {
    throw new MandapamServiceError(404, 'Mandapam not found.');
  }

  // 3. Delete from Supabase Database
  const supabase = getDbClient();
  if (supabase) {
    withTimeout(
      Promise.resolve(supabase.from('mandapams').delete().eq('id', id)),
      2000
    ).catch(() => {});
  }
}
