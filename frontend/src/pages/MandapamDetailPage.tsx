import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteHeader } from '../components/ui/SiteHeader'
import { Badge } from '../components/ui/Badge'
import { ShareButton } from '../components/mandapam/ShareButton'
import { SingleMandapamMapWrapper } from '../components/mandapam/SingleMandapamMapWrapper'
import { MandapamGrid } from '../components/mandapam/MandapamGrid'
import { getFallbackImageUrl, resolveImageUrl } from '../utils/imageUrl'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  clearSingleMandapam,
  loadHomeMandapams,
  loadMandapamById
} from '../features/mandapams/mandapamsSlice'
import { getRecommendedMandapams } from '../services/recommendations'

export function MandapamDetailPage () {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { allMandapams, singleMandapam, loading, loadingSingle, singleError } =
    useAppSelector(state => state.mandapams)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'locating' | 'error'
  >('idle')
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [displayImage, setDisplayImage] = useState(() =>
    resolveImageUrl(
      singleMandapam?.image_url ?? '',
      singleMandapam?.id ?? 'detail'
    )
  )

  useEffect(() => {
    if (!id) {
      dispatch(clearSingleMandapam())
      return
    }

    dispatch(loadMandapamById(id))

    return () => {
      dispatch(clearSingleMandapam())
    }
  }, [dispatch, id])

  useEffect(() => {
    if (allMandapams.length === 0 && !loading) {
      dispatch(loadHomeMandapams())
    }
  }, [allMandapams.length, dispatch, loading])

  useEffect(() => {
    setDisplayImage(
      resolveImageUrl(
        singleMandapam?.image_url ?? '',
        singleMandapam?.id ?? 'detail'
      )
    )
  }, [singleMandapam?.id, singleMandapam?.image_url])

  const locationFields = useMemo(() => {
    if (!singleMandapam) return []

    return [
      singleMandapam.area
        ? { label: 'Area', value: singleMandapam.area }
        : null,
      singleMandapam.address
        ? { label: 'Address', value: singleMandapam.address }
        : null,
      singleMandapam.submitted_by
        ? { label: 'Organizer', value: singleMandapam.submitted_by }
        : null,
      singleMandapam.created_at
        ? {
            label: 'Registered',
            value: new Intl.DateTimeFormat('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }).format(new Date(singleMandapam.created_at))
          }
        : null
    ].filter(Boolean) as Array<{ label: string; value: string }>
  }, [singleMandapam])

  const recommendation = useMemo(() => {
    if (!singleMandapam) {
      return {
        items: [],
        title: 'Explore More Mandapams',
        source: 'empty' as const
      }
    }

    return getRecommendedMandapams({
      selectedMandapam: singleMandapam,
      allMandapams,
      userLocation,
      maxItems: 6
    })
  }, [allMandapams, singleMandapam, userLocation])

  useEffect(() => {
    if (!userLocation) return

    const nearbyResultsSection = document.getElementById('nearby-results')

    if (nearbyResultsSection) {
      window.requestAnimationFrame(() => {
        nearbyResultsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      })
    }
  }, [userLocation, recommendation.items.length])

  if (loadingSingle) {
    return (
      <>
        <SiteHeader />
        <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
          <span className='text-5xl opacity-70' aria-hidden='true'>
            🕉️
          </span>
          <p className='text-base font-medium'>Loading mandapam details…</p>
        </div>
      </>
    )
  }

  if (singleError) {
    return (
      <>
        <SiteHeader />
        <main className='flex-1 pb-16'>
          <div className='mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center'>
            <span className='text-5xl opacity-60' aria-hidden='true'>
              🔍
            </span>
            <h2 className='text-2xl font-bold text-[var(--color-text)]'>
              Mandapam Not Found
            </h2>
            <p className='text-base text-[var(--color-text-secondary)]'>
              The requested Ganesh mandapam could not be found or has not been
              verified yet.
            </p>
            <Link
              to='/'
              className='mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
            >
              ← Back to Explore
            </Link>
          </div>
        </main>
      </>
    )
  }

  if (!singleMandapam) {
    return (
      <>
        <SiteHeader />
        <main className='flex-1 pb-16'>
          <div className='mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center'>
            <span className='text-5xl opacity-60' aria-hidden='true'>
              🔍
            </span>
            <h2 className='text-2xl font-bold text-[var(--color-text)]'>
              Mandapam Not Found
            </h2>
            <p className='text-base text-[var(--color-text-secondary)]'>
              The requested Ganesh mandapam could not be found or has not been
              verified yet.
            </p>
            <Link
              to='/'
              className='mt-2 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]'
            >
              ← Back to Explore
            </Link>
          </div>
        </main>
      </>
    )
  }

  const mandapam = singleMandapam
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mandapam.latitude},${mandapam.longitude}`
  const fallbackImage = getFallbackImageUrl(mandapam.id)

  const locationLabel = [mandapam.area, 'Hyderabad']
    .filter(value => Boolean(value))
    .join(', ')

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationMessage('Location access is not available on this browser.')
      return
    }

    setLocationStatus('locating')
    setLocationMessage(null)

    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationStatus('idle')
        setLocationMessage('Showing mandapams near you.')
      },
      () => {
        setLocationStatus('error')
        setLocationMessage('Location permission was not granted.')
      },
      { timeout: 10000 }
    )
  }

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
        <article className='mx-auto max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8'>
          <div className='grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] lg:items-start'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-wrap items-center gap-2'>
                {mandapam.is_featured && (
                  <Badge variant='featured'>Featured</Badge>
                )}
                {mandapam.is_verified && (
                  <Badge variant='verified'>Verified</Badge>
                )}
              </div>

              <div className='space-y-4'>
                <div>
                  <p className='mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'>
                    Ganesh Mandapam
                  </p>
                  <h1 className='text-3xl font-black tracking-[-0.05em] text-[var(--color-text)] sm:text-4xl lg:text-5xl'>
                    {mandapam.name}
                  </h1>
                </div>

                <div className='rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4'>
                  <p className='flex items-center gap-2 text-base font-semibold text-[var(--color-text)]'>
                    <span aria-hidden='true'>📍</span>
                    <span>{locationLabel}</span>
                  </p>
                  {mandapam.address && (
                    <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
                      {mandapam.address}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <a
                  href={directionsUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] sm:flex-none'
                  aria-label={`Get directions to ${mandapam.name} on Google Maps`}
                >
                  View on map
                </a>
                <button
                  type='button'
                  onClick={handleFindNearby}
                  disabled={locationStatus === 'locating'}
                  className='inline-flex flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none'
                >
                  {locationStatus === 'locating'
                    ? 'Finding nearby mandapams…'
                    : 'Find nearby mandapams'}
                </button>
                <ShareButton
                  mandapamName={mandapam.name}
                  area={mandapam.area}
                  description={mandapam.description}
                  imageUrl={displayImage || fallbackImage}
                  shareUrl={window.location.href}
                  directionsUrl={directionsUrl}
                  className='inline-flex flex-1 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)] sm:flex-none'
                />
              </div>

              {locationMessage && (
                <p className='text-sm text-[var(--color-text-secondary)]'>
                  {locationMessage}
                </p>
              )}

              {mandapam.description && (
                <section aria-label='About this mandapam' className='space-y-3'>
                  <h2 className='text-xl font-bold text-[var(--color-text)]'>
                    About this mandapam
                  </h2>
                  <div className='rounded-[20px] border border-[var(--color-border)] bg-white p-5'>
                    <p className='whitespace-pre-line text-[0.98rem] leading-7 text-[var(--color-text-secondary)]'>
                      {mandapam.description}
                    </p>
                  </div>
                </section>
              )}
            </div>

            <div className='relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]'>
              <img
                src={displayImage}
                alt={mandapam.name}
                onError={() => {
                  setDisplayImage(current =>
                    current === fallbackImage ? current : fallbackImage
                  )
                }}
                className='block h-auto w-full'
              />
            </div>
          </div>

          {locationFields.length > 0 && (
            <div className='mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {locationFields.map(item => (
                <div
                  key={item.label}
                  className='rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4'
                >
                  <p className='text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]'>
                    {item.label}
                  </p>
                  <p className='mt-2 text-base font-medium text-[var(--color-text)]'>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <section className='mt-10' aria-label='Location map'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <h2 className='text-xl font-bold text-[var(--color-text)]'>
                Location map
              </h2>
              <a
                href={directionsUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm font-semibold text-[var(--color-primary-dark)] transition hover:text-[var(--color-primary)]'
              >
                Open in Google Maps
              </a>
            </div>
            <div className='overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white'>
              <SingleMandapamMapWrapper
                latitude={mandapam.latitude}
                longitude={mandapam.longitude}
                name={mandapam.name}
                area={mandapam.area}
              />
            </div>
          </section>

          {recommendation.items.length > 0 && (
            <section
              id='nearby-results'
              className='mt-16'
              aria-label={recommendation.title}
            >
              <div className='mb-6'>
                <p className='mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'>
                  {recommendation.source === 'near-you'
                    ? 'Near you'
                    : recommendation.source === 'nearby'
                    ? 'Nearby'
                    : recommendation.source === 'same-area'
                    ? 'Same location'
                    : 'Explore more'}
                </p>
                <h2 className='text-2xl font-bold tracking-[-0.03em] text-[var(--color-text)]'>
                  {recommendation.title}
                </h2>
              </div>
              <MandapamGrid mandapams={recommendation.items} />
            </section>
          )}

          {recommendation.items.length === 0 && allMandapams.length > 1 && (
            <section className='mt-16' aria-label='Explore more mandapams'>
              <div className='mb-6'>
                <p className='mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'>
                  Explore more
                </p>
                <h2 className='text-2xl font-bold tracking-[-0.03em] text-[var(--color-text)]'>
                  More Mandapams will appear here as they are registered.
                </h2>
              </div>
            </section>
          )}

          <div className='mt-12 text-center'>
            <Link
              to='/'
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
            >
              ← Back to all mandapams
            </Link>
          </div>
        </article>
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
