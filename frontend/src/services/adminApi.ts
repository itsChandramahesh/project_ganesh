import type { Mandapam } from '../types/mandapam';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface AdminMandapam extends Mandapam {
  signed_image_url?: string | null;
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; admin?: { email: string } }> {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Login network request failed.' };
  }
}

export async function adminLogout(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: { 'X-Admin-Action': '1' },
      credentials: 'include',
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}

export async function checkAdminAuth(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/me`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return { authenticated: false };
    const json = await res.json();
    return { authenticated: json.success, email: json.admin?.email };
  } catch {
    return { authenticated: false };
  }
}

export async function fetchAdminMandapams(status = 'all'): Promise<AdminMandapam[]> {
  try {
    const url = new URL(`${API_BASE}/admin/mandapams`, window.location.origin);
    if (status && status !== 'all') {
      url.searchParams.set('status', status);
    }
    const res = await fetch(url.toString(), {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to load admin mandapams');
    const json = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.error('[AdminAPI] fetchAdminMandapams error:', err);
    return [];
  }
}

export async function fetchAdminMandapamById(id: string): Promise<AdminMandapam | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error('[AdminAPI] fetchAdminMandapamById error:', err);
    return null;
  }
}

export async function updateAdminMandapam(
  id: string,
  updates: Partial<Mandapam>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Action': '1',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update mandapam.' };
  }
}

export async function approveAdminMandapam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}/approve`, {
      method: 'POST',
      headers: { 'X-Admin-Action': '1' },
      credentials: 'include',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Approval action failed.' };
  }
}

export async function rejectAdminMandapam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}/reject`, {
      method: 'POST',
      headers: { 'X-Admin-Action': '1' },
      credentials: 'include',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Reject action failed.' };
  }
}

export async function verifyAdminMandapam(
  id: string,
  is_verified: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Action': '1',
      },
      credentials: 'include',
      body: JSON.stringify({ is_verified }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Verification update failed.' };
  }
}

export async function featureAdminMandapam(
  id: string,
  is_featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}/feature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Action': '1',
      },
      credentials: 'include',
      body: JSON.stringify({ is_featured }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Feature update failed.' };
  }
}

export async function deleteAdminMandapam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/mandapams/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Action': '1' },
      credentials: 'include',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Delete action failed.' };
  }
}
