import { useState, useEffect, useCallback, useRef } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents
} from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import {
  reverseGeocodeLocation,
  searchLocations,
  type LocationSuggestion
} from '../../services/api'

const HYDERABAD_CENTER: LatLngTuple = [17.385, 78.4867]
const DEFAULT_ZOOM = 12

function fixLeafletIcons () {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
    ._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })
}

function MapClickHandler ({
  onSelect
}: {
  onSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click (e) {
      onSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

function MapFlyTo ({ center }: { center: LatLngTuple | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.2 })
    }
  }, [map, center])
  return null
}

interface LocationPickerProps {
  selectedLocation: { lat: number; lng: number } | null
  selectedArea: string | null
  areas: string[]
  onAreaChange: (value: string) => void
  onLocationSelect: (coords: { lat: number; lng: number }) => void
  error?: string | null
}

export function LocationPicker ({
  selectedLocation,
  selectedArea,
  areas,
  onAreaChange,
  onLocationSelect,
  error
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false)
  const [geoNotice, setGeoNotice] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<LatLngTuple | null>(null)
  const [searchText, setSearchText] = useState(selectedArea || '')
  const [searchResults, setSearchResults] = useState<LocationSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchRequestId = useRef(0)
  const searchAbortRef = useRef<AbortController | null>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  useEffect(() => {
    setSearchText(selectedArea || '')
  }, [selectedArea])

  useEffect(() => {
    if (searchResults.length === 0) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target

      if (
        target instanceof Node &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setSearchResults([])
        setSearchError(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [searchResults.length])

  useEffect(() => {
    const trimmedQuery = searchText.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    if (trimmedQuery.length < 2) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      const requestId = ++searchRequestId.current
      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller

      setIsSearching(true)
      setSearchError(null)

      void (async () => {
        try {
          const suggestions = await searchLocations(
            trimmedQuery,
            controller.signal
          )

          if (requestId !== searchRequestId.current) {
            return
          }

          setSearchResults(suggestions)
          setSearchError(
            suggestions.length === 0
              ? 'No matching places found. Try a nearby landmark, street, or area.'
              : null
          )
        } catch (err) {
          if (requestId !== searchRequestId.current) {
            return
          }

          const error = err as Error
          if (error.name === 'AbortError') {
            return
          }

          setSearchResults([])
          setSearchError(
            'Unable to load location suggestions right now. Please try again.'
          )
        } finally {
          if (requestId === searchRequestId.current) {
            setIsSearching(false)
          }
        }
      })()
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
      searchAbortRef.current?.abort()
    }
  }, [searchText])

  const syncLocationSelection = useCallback(
    async (coords: { lat: number; lng: number }) => {
      onLocationSelect(coords)
      setFlyTarget([coords.lat, coords.lng])

      try {
        const suggestion = await reverseGeocodeLocation(coords.lat, coords.lng)

        if (!suggestion) {
          return
        }

        const nextArea = suggestion.areaLabel?.trim()
        if (nextArea) {
          onAreaChange(nextArea)
          setSearchText(nextArea)
        }
      } catch {
        return
      }
    },
    [onAreaChange, onLocationSelect]
  )

  const handleSuggestionSelect = useCallback(
    (suggestion: LocationSuggestion) => {
      setSearchResults([])
      setSearchError(null)
      setSearchText(suggestion.areaLabel)
      onAreaChange(suggestion.areaLabel)
      onLocationSelect({ lat: suggestion.latitude, lng: suggestion.longitude })
      setFlyTarget([suggestion.latitude, suggestion.longitude])
      setGeoNotice(null)
    },
    [onAreaChange, onLocationSelect]
  )

  const handleManualSelect = useCallback(
    (lat: number, lng: number) => {
      void syncLocationSelection({ lat, lng })
      setGeoNotice(null)
    },
    [syncLocationSelection]
  )

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice(
        'Geolocation is not supported by your browser. You can select the location manually on the map.'
      )
      return
    }

    setIsLocating(true)
    setGeoNotice(null)

    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        setIsLocating(false)
        setGeoNotice(
          'Location detected. You can adjust the pin on the map if needed.'
        )

        void syncLocationSelection(coords)
      },
      err => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice(
            'Location access was denied. You can select the location manually on the map.'
          )
        } else {
          setGeoNotice(
            'Unable to determine your location. You can select the location manually on the map.'
          )
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }

  const markerPosition: LatLngTuple | null = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : null

  return (
    <div className='flex w-full flex-col gap-3'>
      <div ref={searchContainerRef} className='relative z-[1200] space-y-2'>
        <input
          type='text'
          value={searchText}
          onChange={event => setSearchText(event.target.value)}
          placeholder='Search area, street or landmark...'
          className={`w-full rounded-[12px] border bg-white px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] ${
            error ? 'border-red-300' : 'border-[var(--color-border)]'
          }`}
          aria-label='Search area, street or landmark'
        />

        {isSearching && (
          <div className='rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-secondary)]'>
            Searching locations…
          </div>
        )}

        {searchError && (
          <div className='rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
            {searchError}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className='absolute inset-x-0 top-full z-[1000] mt-2 overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(17,17,17,0.12)]'>
            <div className='max-h-56 overflow-y-auto bg-white'>
              {searchResults.map(result => (
                <button
                  key={result.id}
                  type='button'
                  onClick={() => handleSuggestionSelect(result)}
                  className='flex w-full items-start gap-3 border-b border-[var(--color-border)] bg-white px-3 py-2.5 text-left transition last:border-b-0 hover:bg-[var(--color-surface-muted)]'
                >
                  <div className='flex-1'>
                    <div className='text-sm font-medium text-[var(--color-text)]'>
                      {result.displayName}
                    </div>
                    {result.areaLabel &&
                      result.areaLabel !== result.displayName && (
                        <div className='text-[11px] text-[var(--color-text-muted)]'>
                          {result.areaLabel}
                        </div>
                      )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <button
          type='button'
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60'
          aria-busy={isLocating}
        >
          {isLocating ? '⏳ Detecting location…' : 'Use my location'}
        </button>
        <span className='text-xs text-[var(--color-text-muted)]'>
          or tap anywhere on the map to set the pin
        </span>
      </div>

      {geoNotice && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            geoNotice.includes('denied') || geoNotice.includes('Unable')
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
          role='status'
        >
          {geoNotice}
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-[16px] border ${
          error ? 'border-red-300' : 'border-[var(--color-border)]'
        }`}
      >
        <MapContainer
          center={HYDERABAD_CENTER}
          zoom={DEFAULT_ZOOM}
          className='h-[280px] w-full sm:h-[320px]'
          style={{ height: '280px', width: '100%' }}
          scrollWheelZoom={false}
          aria-label='Map location picker for Ganesh mandapam'
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          <MapClickHandler onSelect={handleManualSelect} />
          <MapFlyTo center={flyTarget} />

          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              eventHandlers={{
                dragend: event => {
                  const latLng = event.target.getLatLng()
                  void syncLocationSelection({
                    lat: latLng.lat,
                    lng: latLng.lng
                  })
                }
              }}
            >
              <Popup autoPan>
                <div className='map-popup'>
                  <strong>📍 Mandapam Location</strong>
                  <span>
                    {selectedLocation?.lat.toFixed(5)},{' '}
                    {selectedLocation?.lng.toFixed(5)}
                  </span>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {selectedLocation ? (
        <div className='flex flex-col gap-1 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2'>
          <span className='text-sm font-semibold text-emerald-700'>
            ✓ Location selected
          </span>
          <span className='text-sm text-emerald-800'>
            {selectedArea?.trim()
              ? selectedArea.trim()
              : `${selectedLocation.lat.toFixed(
                  5
                )}° N, ${selectedLocation.lng.toFixed(5)}° E`}
          </span>
        </div>
      ) : (
        <div className='rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2'>
          <span className='text-sm text-[var(--color-text-secondary)]'>
            Choose the Mandapam location on the map or use your current
            location.
          </span>
        </div>
      )}

      {error && (
        <p className='text-sm font-semibold text-red-600' role='alert'>
          {error}
        </p>
      )}
    </div>
  )
}
