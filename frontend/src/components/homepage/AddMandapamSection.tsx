import { Link } from 'react-router-dom'

export function AddMandapamSection () {
  return (
    <section
      className='border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] py-16'
      aria-label='Add a mandapam'
    >
      <div className='container'>
        <div className='flex flex-col items-center justify-center gap-4 text-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-2xl'>
            🛕
          </div>
          <h2 className='text-3xl font-bold tracking-[-0.04em] text-[var(--color-text)]'>
            Know a Ganesh Mandapam We&apos;re Missing?
          </h2>
          <p className='max-w-xl text-base text-[var(--color-text-secondary)]'>
            Help other Hyderabad residents discover a meaningful darshan spot,
            ritual venue, or community gathering place.
          </p>
          <Link
            to='/submit'
            className='inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-7 py-3 text-base font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
          >
            Add a Mandapam
          </Link>
        </div>
      </div>
    </section>
  )
}
