import type { Mandapam } from '../types/mandapam'
import { haversineDistance } from '../utils/distance'

export interface RecommendationInput {
  selectedMandapam: Mandapam
  allMandapams: Mandapam[]
  userLocation?: { lat: number; lng: number } | null
  maxItems?: number
}

export interface RecommendationResult {
  items: Mandapam[]
  title: string
  source: 'near-you' | 'nearby' | 'same-area' | 'featured' | 'empty'
}

function normalizeLocationValue (value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,/()\-]/g, ' ')
    .replace(/\s+/g, ' ')
}

function hasCoordinates (mandapam: Mandapam): boolean {
  return (
    typeof mandapam.latitude === 'number' &&
    typeof mandapam.longitude === 'number' &&
    Number.isFinite(mandapam.latitude) &&
    Number.isFinite(mandapam.longitude)
  )
}

export function getRecommendedMandapams ({
  selectedMandapam,
  allMandapams,
  userLocation,
  maxItems = 6
}: RecommendationInput): RecommendationResult {
  const candidates = allMandapams.filter(
    item => item.id !== selectedMandapam.id
  )

  const sameAreaKey = normalizeLocationValue(selectedMandapam.area)
  const sameAreaCandidates = candidates.filter(item => {
    if (!sameAreaKey) return false
    return normalizeLocationValue(item.area) === sameAreaKey
  })

  const sameAreaFallback = candidates.filter(item => {
    if (!sameAreaKey) return false
    return (
      normalizeLocationValue(item.area) === sameAreaKey ||
      normalizeLocationValue(item.address) === sameAreaKey
    )
  })

  const featuredCandidates = candidates.filter(item => item.is_featured)
  const verifiedCandidates = candidates.filter(item => item.is_verified)

  const nearbyFromSelected = candidates
    .filter(item => hasCoordinates(item) && hasCoordinates(selectedMandapam))
    .map(item => ({
      item,
      distance: haversineDistance(
        selectedMandapam.latitude,
        selectedMandapam.longitude,
        item.latitude,
        item.longitude
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .map(entry => entry.item)

  const nearbyFromUser = userLocation
    ? candidates
        .filter(item => hasCoordinates(item))
        .map(item => ({
          item,
          distance: haversineDistance(
            userLocation.lat,
            userLocation.lng,
            item.latitude,
            item.longitude
          )
        }))
        .filter(entry => Number.isFinite(entry.distance))
        .sort((a, b) => a.distance - b.distance)
        .map(entry => entry.item)
    : []

  const orderedItems: Mandapam[] = []
  const seen = new Set<string>()

  const pushUnique = (items: Mandapam[]) => {
    for (const item of items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      orderedItems.push(item)
      if (orderedItems.length >= maxItems) break
    }
  }

  if (userLocation && nearbyFromUser.length > 0) {
    pushUnique(nearbyFromUser)
  } else if (nearbyFromSelected.length > 0) {
    pushUnique(nearbyFromSelected)
  }

  if (sameAreaCandidates.length > 0) {
    pushUnique(sameAreaCandidates)
  } else if (sameAreaFallback.length > 0) {
    pushUnique(sameAreaFallback)
  }

  if (featuredCandidates.length > 0) {
    pushUnique(featuredCandidates)
  }

  if (verifiedCandidates.length > 0) {
    pushUnique(verifiedCandidates)
  }

  if (orderedItems.length === 0) {
    const fallbackItems = candidates.slice(0, maxItems)
    return {
      items: fallbackItems,
      title: 'Explore More Mandapams',
      source: 'empty'
    }
  }

  const title =
    userLocation && nearbyFromUser.length > 0
      ? 'Mandapams Near You'
      : nearbyFromSelected.length > 0
      ? 'Mandapams Nearby'
      : sameAreaCandidates.length > 0 || sameAreaFallback.length > 0
      ? `More Mandapams in ${selectedMandapam.area}`
      : 'Explore More Mandapams'

  const source =
    userLocation && nearbyFromUser.length > 0
      ? 'near-you'
      : nearbyFromSelected.length > 0
      ? 'nearby'
      : sameAreaCandidates.length > 0 || sameAreaFallback.length > 0
      ? 'same-area'
      : featuredCandidates.length > 0
      ? 'featured'
      : 'empty'

  return {
    items: orderedItems.slice(0, maxItems),
    title,
    source
  }
}
