import { MandapamMap } from '../map/MandapamMap'
import type { Mandapam } from '../../types/mandapam'

interface MapSectionProps {
  mandapams: Mandapam[]
  userLocation: { lat: number; lng: number } | null
  nearMeActive?: boolean
}

export function MapSection ({
  mandapams,
  userLocation,
  nearMeActive = false
}: MapSectionProps) {
  return (
    <section className='py-16' aria-label='Map of mandapams'>
      <div className='container'>
        <h2 className='mb-4 text-2xl font-bold tracking-[-0.02em] text-[var(--color-text)]'>
          📍 Mandapam Map
        </h2>
        <p className='mb-5 text-sm text-[var(--color-text-secondary)]'>
          {nearMeActive
            ? 'Showing mandapams within 10 km of your location.'
            : 'All verified Ganesh mandapams across Hyderabad.'}
        </p>
        <div className='overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white'>
          <MandapamMap mandapams={mandapams} userLocation={userLocation} />
        </div>
      </div>
    </section>
  )
}
