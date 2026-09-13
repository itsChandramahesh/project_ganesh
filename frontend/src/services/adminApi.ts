import type { Mandapam } from '../types/mandapam';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'gd_admin_token';

export interface AdminMandapam extends Mandapam {
  signed_image_url?: string | null;
}

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = getAdminToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function adminLogin(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; token?: string; admin?: { email: string } }> {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.success && json.token) {
      setAdminToken(json.token);
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Login network request failed.' };
  }
}

export async function adminLogout(): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      headers: getAuthHeaders({ 'X-Admin-Action': '1' }),
      credentials: 'include',
    });
    clearAdminToken();
    return await res.json();
  } catch {
    clearAdminToken();
    return { success: false };
  }
}

export async function checkAdminAuth(): Promise<{ authenticated: boolean; email?: string }> {
  const token = getAdminToken();
  if (!token) {
    return { authenticated: false };
  }

  try {
    const res = await fetch(`${API_BASE}/admin/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearAdminToken();
      }
      return { authenticated: false };
    }
    const json = await res.json();
    if (!json.success) {
      clearAdminToken();
      return { authenticated: false };
    }
    return { authenticated: true, email: json.admin?.email };
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'X-Admin-Action': '1',
      }),
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
      headers: getAuthHeaders({ 'X-Admin-Action': '1' }),
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
      headers: getAuthHeaders({ 'X-Admin-Action': '1' }),
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
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'X-Admin-Action': '1',
      }),
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
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'X-Admin-Action': '1',
      }),
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
      headers: getAuthHeaders({ 'X-Admin-Action': '1' }),
      credentials: 'include',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Delete action failed.' };
  }
}
