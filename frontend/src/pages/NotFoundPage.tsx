import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/ui/SiteHeader'

export function NotFoundPage () {
  return (
    <>
      <SiteHeader />
      <main className='flex-1 bg-white pb-16'>
        <div className='mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center'>
          <span className='text-5xl opacity-60' aria-hidden='true'>
            4️⃣0️⃣4️⃣
          </span>
          <h2 className='text-2xl font-bold text-[var(--color-text)]'>
            Page Not Found
          </h2>
          <p className='text-base text-[var(--color-text-secondary)]'>
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            to='/'
            className='mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
          >
            ← Return to Home
          </Link>
        </div>
      </main>
    </>
  )
}
