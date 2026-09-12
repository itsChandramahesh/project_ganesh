import type { Mandapam } from '../types/mandapam'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export interface LocationSuggestion {
  id: string
  displayName: string
  latitude: number
  longitude: number
  areaLabel: string
}

function createLocationSuggestion (payload: any): LocationSuggestion | null {
  if (!payload) {
    return null
  }

  const latitude = Number(payload.lat ?? payload.latitude)
  const longitude = Number(payload.lon ?? payload.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const address = payload.address ?? {}
  const areaLabel = (
    address.suburb ||
    address.neighbourhood ||
    address.town ||
    address.village ||
    address.city ||
    address.county ||
    address.state_district ||
    address.state ||
    payload.display_name ||
    'Selected location'
  )
    .trim()
    .slice(0, 100)

  return {
    id: String(payload.place_id ?? `${latitude}-${longitude}`),
    displayName: payload.display_name || areaLabel,
    latitude,
    longitude,
    areaLabel
  }
}

export async function searchLocations (
  query: string,
  signal?: AbortSignal
): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', trimmedQuery)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '6')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'en')
    url.searchParams.set('countrycodes', 'in')
    url.searchParams.set('bounded', '1')
    url.searchParams.set('viewbox', '78.25,17.65,78.70,17.20')

    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'Accept-Language': 'en'
      }
    })

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.statusText}`)
    }

    const json = await response.json()
    if (!Array.isArray(json)) {
      return []
    }

    return json
      .map(createLocationSuggestion)
      .filter((suggestion): suggestion is LocationSuggestion => !!suggestion)
  } catch (err) {
    console.error('[API] searchLocations error:', err)
    throw err
  }
}

export async function reverseGeocodeLocation (
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<LocationSuggestion | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', latitude.toString())
    url.searchParams.set('lon', longitude.toString())
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('zoom', '18')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'en')

    const response = await fetch(url.toString(), {
      signal,
      headers: {
        'Accept-Language': 'en'
      }
    })

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`)
    }

    const json = await response.json()
    return createLocationSuggestion({ ...json, lat: latitude, lon: longitude })
  } catch (err) {
    console.error('[API] reverseGeocodeLocation error:', err)
    throw err
  }
}

export async function fetchMandapams (params?: {
  area?: string
  search?: string
}): Promise<Mandapam[]> {
  try {
    const url = new URL(`${API_BASE}/mandapams`, window.location.origin)
    if (params?.area && params.area !== 'all') {
      url.searchParams.set('area', params.area)
    }
    if (params?.search && params.search.trim()) {
      url.searchParams.set('search', params.search.trim())
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Failed to fetch mandapams: ${response.statusText}`)
    }

    const json = await response.json()
    return json.data ?? []
  } catch (err) {
    console.error('[API] fetchMandapams error:', err)
    return []
  }
}

export async function fetchFeaturedMandapams (): Promise<Mandapam[]> {
  try {
    const response = await fetch(`${API_BASE}/mandapams/featured`)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch featured mandapams: ${response.statusText}`
      )
    }

    const json = await response.json()
    return json.data ?? []
  } catch (err) {
    console.error('[API] fetchFeaturedMandapams error:', err)
    return []
  }
}

export async function fetchMandapamById (id: string): Promise<Mandapam | null> {
  try {
    const response = await fetch(`${API_BASE}/mandapams/${id}`)
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch mandapam ${id}: ${response.statusText}`)
    }

    const json = await response.json()
    return json.data ?? null
  } catch (err) {
    console.error('[API] fetchMandapamById error:', err)
    return null
  }
}

export async function submitMandapam (
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/mandapams`, {
      method: 'POST',
      body: formData
    })

    const json = await response.json()
    if (!response.ok) {
      return {
        success: false,
        error: json.error || 'Failed to submit mandapam'
      }
    }

    return {
      success: true,
      message: json.message || 'Mandapam submitted successfully!'
    }
  } catch (err: any) {
    console.error('[API] submitMandapam error:', err)
    return {
      success: false,
      error: err?.message || 'Network error occurred while submitting.'
    }
  }
}

export async function checkBackendHealth (): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return response.ok
  } catch {
    return false
  }
}
