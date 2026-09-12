import { useState, useMemo, useCallback } from 'react'
import type { Mandapam } from '../types/mandapam'
import { haversineDistance } from '../utils/distance'
import { HeroSection } from './homepage/HeroSection'
import { FeaturedMandapamsSection } from './homepage/FeaturedMandapamsSection'
import { MapSection } from './homepage/MapSection'
import { AllMandapamsSection } from './homepage/AllMandapamsSection'
import { AddMandapamSection } from './homepage/AddMandapamSection'

interface HomepageContentProps {
  allMandapams: Mandapam[]
  featuredMandapams: Mandapam[]
  loading?: boolean
  error?: string | null
}

export function HomepageContent ({
  allMandapams,
  featuredMandapams,
  loading = false,
  error = null
}: HomepageContentProps) {
  const NEAR_ME_RADIUS_KM = 10

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [sortByDistance, setSortByDistance] = useState(false)

  const availableAreas = useMemo(() => {
    const areas = new Set(allMandapams.map(m => m.area))
    return Array.from(areas).sort()
  }, [allMandapams])

  const distanceMap = useMemo<Record<string, number>>(() => {
    if (!userLocation) return {}

    return Object.fromEntries(
      allMandapams.map(m => [
        m.id,
        haversineDistance(
          userLocation.lat,
          userLocation.lng,
          m.latitude,
          m.longitude
        )
      ])
    )
  }, [userLocation, allMandapams])

  const filteredMandapams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    let result = allMandapams.filter(m => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.area.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q)

      const matchesArea = !selectedArea || m.area === selectedArea

      return matchesSearch && matchesArea
    })

    if (sortByDistance && userLocation) {
      result = result
        .filter(m => (distanceMap[m.id] ?? Infinity) <= NEAR_ME_RADIUS_KM)
        .sort(
          (a, b) =>
            (distanceMap[a.id] ?? Infinity) - (distanceMap[b.id] ?? Infinity)
        )
    }

    return result
  }, [
    allMandapams,
    searchQuery,
    selectedArea,
    sortByDistance,
    userLocation,
    distanceMap,
    NEAR_ME_RADIUS_KM
  ])

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSortByDistance(true)
        setIsLocating(false)
        document
          .getElementById('all-mandapams')
          ?.scrollIntoView({ behavior: 'smooth' })
      },
      err => {
        setIsLocating(false)

        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            'Location permission denied. Please allow location access and try again.'
          )
        } else {
          setLocationError(
            'Unable to determine your location. Please try again.'
          )
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    )
  }, [])

  const clearLocationSort = useCallback(() => {
    setSortByDistance(false)
    setUserLocation(null)
    setLocationError(null)
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedArea(null)
    clearLocationSort()
  }, [clearLocationSort])

  const handleAreaSelect = useCallback((area: string) => {
    setSelectedArea(prev => (prev === area ? null : area))
  }, [])

  const handleScrollToMandapams = useCallback(() => {
    document
      .getElementById('all-mandapams')
      ?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const hasActiveFilters = Boolean(
    searchQuery || selectedArea || sortByDistance
  )
  const showMandapamLoadingState = loading && allMandapams.length === 0

  return (
    <div className='flex-1'>
      <HeroSection
        isLocating={isLocating}
        locationError={locationError}
        sortByDistance={sortByDistance}
        onNearMe={handleNearMe}
        onResetLocationSort={clearLocationSort}
      />

      {error && (
        <div className='container pt-4'>
          <div
            className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
            role='alert'
          >
            ⚠️ {error}
          </div>
        </div>
      )}

      <FeaturedMandapamsSection
        featuredMandapams={featuredMandapams}
        distanceMap={distanceMap}
      />

      <MapSection
        mandapams={
          sortByDistance && userLocation ? filteredMandapams : allMandapams
        }
        userLocation={userLocation}
        nearMeActive={sortByDistance && Boolean(userLocation)}
      />

      <AllMandapamsSection
        allMandapams={allMandapams}
        filteredMandapams={filteredMandapams}
        selectedArea={selectedArea}
        hasActiveFilters={hasActiveFilters}
        showMandapamLoadingState={showMandapamLoadingState}
        sortByDistance={sortByDistance}
        distanceMap={distanceMap}
        onClearAllFilters={clearAllFilters}
        searchQuery={searchQuery}
        availableAreas={availableAreas}
        onSearchChange={setSearchQuery}
        onAreaSelect={setSelectedArea}
      />

      <AddMandapamSection />
    </div>
  )
}
