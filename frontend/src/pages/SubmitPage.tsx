import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/ui/SiteHeader'
import { SubmitMandapamForm } from '../components/submit/SubmitMandapamForm'

export function SubmitPage () {
  return (
    <>
      <SiteHeader />

      <nav
        className='border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]'
        aria-label='Breadcrumb'
      >
        <div className='container py-3'>
          <Link
            to='/'
            className='inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text)]'
          >
            ← Explore Mandapams
          </Link>
        </div>
      </nav>

      <main className='flex-1 bg-white pb-16'>
        <div className='mx-auto max-w-[820px] px-4 pt-8 sm:px-6 lg:px-8'>
          <header className='mb-7 text-center'>
            <h1 className='text-3xl font-extrabold tracking-[-0.05em] text-[var(--color-text)] sm:text-4xl'>
              Know a Ganesh Mandapam we&apos;re missing?
            </h1>
            <p className='mt-3 text-lg text-[var(--color-text-secondary)]'>
              Help Hyderabad discover it.
            </p>
            <p className='mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]'>
              Share a Mandapam with the community. We&apos;ll review your
              submission before it appears in the directory.
            </p>
          </header>

          <SubmitMandapamForm />
        </div>
      </main>

      <footer className='border-t border-[var(--color-border)] bg-white'>
        <div className='container flex flex-col items-center gap-1 py-7 text-center'>
          <p className='text-sm font-semibold text-[var(--color-text)]'>
            © {new Date().getFullYear()} Ganesh Darshan Hyderabad
          </p>
          <p className='text-xs text-[var(--color-text-muted)]'>
            Community-driven directory of Ganesh mandapams across Hyderabad.
          </p>
        </div>
      </footer>
    </>
  )
}
