import heroImage from '../../Assets/ganesh01.jpg'

interface HeroSectionProps {
  isLocating: boolean
  locationError: string | null
  sortByDistance: boolean
  onNearMe: () => void
  onResetLocationSort: () => void
}

export function HeroSection ({
  isLocating,
  locationError,
  sortByDistance,
  onNearMe,
  onResetLocationSort
}: HeroSectionProps) {
  return (
    <section
      className='border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-10 md:py-16'
      aria-label='Hero'
    >
      <div className='container'>
        <div className='grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]'>
          <div className='text-left'>
            <div className='mb-4 inline-flex items-center rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-dark)]'>
              Ganesh Darshan Hyderabad
            </div>
            <h1 className='text-4xl font-extrabold leading-[0.96] tracking-[-0.06em] text-[var(--color-text)] md:text-6xl'>
              Where devotion
              <br className='hidden md:block' />
              comes alive.
            </h1>
            <p className='mt-5 max-w-xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg'>
              Experience the beauty, tradition and celebration of Ganesh Utsav
              in Hyderabad — with mandapams, community recommendations, and
              nearby darshan insights.
            </p>

            <div className='mt-6 flex flex-wrap items-center gap-3'>
              <button
                id='near-me-btn'
                type='button'
                onClick={onNearMe}
                disabled={isLocating}
                className='inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60 md:px-7 md:py-3.5'
                aria-busy={isLocating}
              >
                {isLocating ? 'Locating…' : 'Find Near Me'}
              </button>
              <a
                href='#all-mandapams'
                className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] md:px-7 md:py-3.5'
              >
                Explore Mandapams
              </a>
            </div>

            {locationError && (
              <div
                className='mt-5 max-w-xl rounded-[var(--radius-md)] border border-red-200 bg-white px-4 py-3 text-sm text-red-700'
                role='alert'
              >
                ⚠️ {locationError}
              </div>
            )}

            {sortByDistance && !locationError && (
              <div className='mt-5 max-w-xl rounded-[var(--radius-md)] border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700'>
                ✅ Sorted by distance from your location.{' '}
                <button
                  type='button'
                  onClick={onResetLocationSort}
                  className='font-semibold text-emerald-700 underline underline-offset-2'
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className='relative'>
            <div className='overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-white p-2 shadow-[0_20px_45px_rgba(17,17,17,0.06)]'>
              <img
                src={heroImage}
                alt='Ganesh mandapam artwork'
                className='h-[430px] w-full rounded-[1.5rem] object-cover md:h-[520px]'
              />
            </div>

            <div className='absolute -bottom-4 left-4 rounded-[1.25rem] border border-[var(--color-border)] bg-white/95 p-3 shadow-[0_12px_32px_rgba(17,17,17,0.08)] backdrop-blur-sm'>
              <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]'>
                Featured this season
              </p>
              <p className='mt-1 text-base font-semibold text-[var(--color-text)]'>
                Community-curated mandapams
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
