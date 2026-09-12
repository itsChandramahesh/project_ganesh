import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'

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

interface SingleMandapamMapProps {
  latitude: number
  longitude: number
  name: string
  area: string
  zoom?: number
}

export function SingleMandapamMap ({
  latitude,
  longitude,
  name,
  area,
  zoom = 15
}: SingleMandapamMapProps) {
  useEffect(() => {
    fixLeafletIcons()
  }, [])

  const position: LatLngTuple = [latitude, longitude]
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      className='mandapam-map'
      style={{ height: '420px', width: '100%' }}
      scrollWheelZoom={false}
      aria-label={`Map showing location of ${name}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      <Marker position={position}>
        <Popup autoPan>
          <div className='map-popup'>
            <strong>{name}</strong>
            <span>📍 {area}</span>
            <a
              href={directionsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='map-popup-link'
            >
              Get Directions →
            </a>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
