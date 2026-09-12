import { MandapamGrid } from '../mandapam/MandapamGrid'
import type { Mandapam } from '../../types/mandapam'

interface FeaturedMandapamsSectionProps {
  featuredMandapams: Mandapam[]
  distanceMap: Record<string, number>
}

export function FeaturedMandapamsSection ({
  featuredMandapams,
  distanceMap
}: FeaturedMandapamsSectionProps) {
  if (featuredMandapams.length === 0) {
    return null
  }

  return (
    <section className='py-16' aria-label='Popular mandapams'>
      <div className='container'>
        <h2 className='mb-5 text-2xl font-bold tracking-[-0.02em] text-[var(--color-text)]'>
          ✨ Popular Mandapams
        </h2>
        <MandapamGrid mandapams={featuredMandapams} distances={distanceMap} />
      </div>
    </section>
  )
}
