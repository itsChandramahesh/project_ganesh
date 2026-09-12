import { Link } from 'react-router-dom'

interface SiteHeaderProps {
  exploreHref?: string
}

export function SiteHeader ({
  exploreHref = '/#all-mandapams'
}: SiteHeaderProps) {
  return (
    <header className='sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/95 backdrop-blur-sm'>
      <div className='container flex items-center justify-between gap-4 py-3'>
        <Link
          to='/'
          className='flex shrink-0 items-center gap-3'
          aria-label='Ganesh Darshan Hyderabad home'
        >
          <span
            className='flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] text-lg leading-none'
            aria-hidden='true'
          >
            🕉️
          </span>
          <span className='flex flex-col leading-none'>
            <span className='text-base font-bold text-[var(--color-text)]'>
              Ganesh Darshan
            </span>
            <span className='mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-dark)]'>
              Hyderabad
            </span>
          </span>
        </Link>

        <nav
          className='flex items-center gap-2 sm:gap-4'
          aria-label='Site navigation'
        >
          {exploreHref.startsWith('/#') ? (
            <a
              href={exploreHref}
              className='rounded-full px-2.5 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
            >
              Explore
            </a>
          ) : (
            <Link
              to={exploreHref}
              className='rounded-full px-2.5 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]'
            >
              Explore
            </Link>
          )}

          <Link
            to='/submit'
            className='inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
          >
            Add Mandapam
          </Link>
        </nav>
      </div>
    </header>
  )
}
