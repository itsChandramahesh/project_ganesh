import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import { Link } from 'react-router-dom'
import type { Mandapam } from '../../types/mandapam'

// Hyderabad city center
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

function MapCenter ({ center }: { center: LatLngTuple }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [map, center])
  return null
}

interface MandapamMapProps {
  mandapams: Mandapam[]
  userLocation?: { lat: number; lng: number } | null
}

export function MandapamMap ({ mandapams, userLocation }: MandapamMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const center: LatLngTuple = userLocation
    ? [userLocation.lat, userLocation.lng]
    : HYDERABAD_CENTER

  return (
    <MapContainer
      center={HYDERABAD_CENTER}
      zoom={DEFAULT_ZOOM}
      className='mandapam-map'
      style={{ height: '420px', width: '100%' }}
      scrollWheelZoom={false}
      aria-label='Map of Ganesh mandapams in Hyderabad'
    >
      <MapCenter center={center} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>📍 Your location</Popup>
        </Marker>
      )}

      {/* Mandapam markers */}
      {mandapams.map(m => (
        <Marker key={m.id} position={[m.latitude, m.longitude]}>
          <Popup>
            <div className='map-popup'>
              <strong>{m.name}</strong>
              <span>{m.area}</span>
              <Link to={`/mandapams/${m.id}`} className='map-popup-link'>
                View Details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
