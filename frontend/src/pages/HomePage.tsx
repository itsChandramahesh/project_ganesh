import { useEffect } from 'react'
import { SiteHeader } from '../components/ui/SiteHeader'
import { HomepageContent } from '../components/HomepageContent'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loadHomeMandapams } from '../features/mandapams/mandapamsSlice'

export function HomePage () {
  const dispatch = useAppDispatch()
  const { allMandapams, featuredMandapams, loading, error } = useAppSelector(
    state => state.mandapams
  )

  useEffect(() => {
    dispatch(loadHomeMandapams())
  }, [dispatch])

  return (
    <>
      <SiteHeader />

      <main>
        <HomepageContent
          allMandapams={allMandapams}
          featuredMandapams={featuredMandapams}
          loading={loading}
          error={error}
        />
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
