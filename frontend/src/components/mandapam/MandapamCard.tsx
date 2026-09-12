import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Mandapam } from '../../types/mandapam'
import { Badge } from '../ui/Badge'
import { getFallbackImageUrl, resolveImageUrl } from '../../utils/imageUrl'

interface MandapamCardProps {
  mandapam: Mandapam
  /** Distance from user in km — shown only when Near Me is active */
  distanceKm?: number
}

export function MandapamCard ({ mandapam }: MandapamCardProps) {
  const fallbackImage = getFallbackImageUrl(mandapam.id)
  const [displayImage, setDisplayImage] = useState(() =>
    resolveImageUrl(mandapam.image_url, mandapam.id)
  )
  const locationText = [mandapam.area, 'Hyderabad'].filter(Boolean).join(', ')

  return (
    <div className='group rounded-[18px] bg-[var(--color-surface)]'>
      <Link
        to={`/mandapams/${mandapam.id}`}
        aria-label={`${mandapam.name} in ${locationText}`}
        className='block overflow-hidden rounded-[18px] focus-visible:outline-none'
      >
        <div className='relative overflow-hidden rounded-[18px] bg-[var(--color-surface-muted)]'>
          <img
            src={displayImage}
            alt={mandapam.name}
            loading='lazy'
            decoding='async'
            onError={() => {
              setDisplayImage(current =>
                current === fallbackImage ? current : fallbackImage
              )
            }}
            className='block h-auto w-full transition duration-300 ease-out group-hover:scale-[1.02] group-focus-visible:scale-[1.02]'
          />

          <div className='absolute inset-0 bg-[rgba(17,17,17,0.38)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100' />

          <div className='absolute left-3 top-3 flex flex-wrap gap-1.5'>
            {mandapam.is_featured && <Badge variant='featured'>Featured</Badge>}
          </div>

          <div className='pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0 md:p-4'>
            <p className='text-[0.62rem] font-medium uppercase tracking-[0.15em] text-white/75'>
              {locationText}
            </p>
            <h3 className='mt-1 text-base font-semibold leading-tight tracking-[-0.02em] sm:text-lg'>
              {mandapam.name}
            </h3>
          </div>
        </div>
      </Link>

      <div className='mt-2 flex items-center justify-between gap-2 px-1 pb-1 md:hidden'>
        <div>
          <p className='text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]'>
            {locationText}
          </p>
          <h3 className='text-sm font-semibold text-[var(--color-text)]'>
            {mandapam.name}
          </h3>
        </div>
        {mandapam.is_featured && (
          <Badge variant='featured' className='shrink-0'>
            Featured
          </Badge>
        )}
      </div>
    </div>
  )
}
