import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  fetchAdminMandapams,
  fetchAdminMandapamById,
  updateAdminMandapam,
  approveAdminMandapam,
  rejectAdminMandapam,
  verifyAdminMandapam,
  featureAdminMandapam,
  deleteAdminMandapam,
  adminLogout,
  checkAdminAuth,
  AdminMandapam
} from '../../services/adminApi'

const tabs = [
  { value: 'pending', label: 'Pending Submissions' },
  { value: 'approved', label: 'Approved Listings' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All Records' }
] as const

type AdminTab = typeof tabs[number]['value']

function formatDate (value?: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatDateTime (value?: string | null) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function hasValue (value: unknown) {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  return Boolean(value)
}

function getCardImage (mandapam: AdminMandapam) {
  if (mandapam.signed_image_url) return mandapam.signed_image_url
  if (mandapam.image_url) return mandapam.image_url
  return null
}

export function AdminDashboardPage () {
  const [mandapams, setMandapams] = useState<AdminMandapam[]>([])
  const [activeTab, setActiveTab] = useState<AdminTab>('pending')
  const [adminEmail, setAdminEmail] = useState<string>('admin')
  const [isLoading, setIsLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [editingMandapam, setEditingMandapam] = useState<AdminMandapam | null>(
    null
  )
  const [editForm, setEditForm] = useState({
    name: '',
    area: '',
    address: '',
    description: '',
    latitude: '',
    longitude: ''
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [inspectingMandapam, setInspectingMandapam] =
    useState<AdminMandapam | null>(null)
  const [isLoadingInspect, setIsLoadingInspect] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAuth().then(res => {
      if (res.email) setAdminEmail(res.email)
    })
  }, [])

  const loadMandapams = useCallback(async () => {
    setIsLoading(true)
    setActionError(null)

    try {
      const data = await fetchAdminMandapams(activeTab)
      setMandapams(data)
    } catch (err: any) {
      setActionError(err.message || 'Failed to fetch mandapams.')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadMandapams()
  }, [loadMandapams])

  useEffect(() => {
    if (!inspectingMandapam) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInspectingMandapam(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inspectingMandapam])

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [inspectingMandapam?.id])

  const refreshSelectedMandapam = useCallback(async (id: string) => {
    const detailed = await fetchAdminMandapamById(id)
    if (detailed) {
      setInspectingMandapam(detailed)
    }
  }, [])

  const filteredMandapams = mandapams.filter(mandapam => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) return true

    return [
      mandapam.name,
      mandapam.area,
      mandapam.address,
      mandapam.submitted_by
    ].some(
      value => hasValue(value) && String(value).toLowerCase().includes(term)
    )
  })

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin/login', { replace: true })
  }

  const handleApprove = async (id: string) => {
    setActionError(null)
    setActionSuccess(null)

    const res = await approveAdminMandapam(id)

    if (res.success) {
      setActionSuccess(
        'Mandapam approved successfully and is now publicly live.'
      )
      await loadMandapams()
      await refreshSelectedMandapam(id)
    } else {
      setActionError(res.error || 'Failed to approve mandapam.')
    }
  }

  const handleReject = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Reject "${name}"? This submission will move to the rejected queue.`
    )

    if (!confirmed) return

    setActionError(null)
    setActionSuccess(null)

    const res = await rejectAdminMandapam(id)

    if (res.success) {
      setActionSuccess('Mandapam rejected.')
      await loadMandapams()
      await refreshSelectedMandapam(id)
    } else {
      setActionError(res.error || 'Failed to reject mandapam.')
    }
  }

  const handleToggleVerified = async (m: AdminMandapam) => {
    setActionError(null)
    setActionSuccess(null)

    const res = await verifyAdminMandapam(m.id, !m.is_verified)

    if (res.success) {
      setActionSuccess(
        `${
          m.is_verified ? 'Verification removed from' : 'Verification added to'
        } ${m.name}.`
      )
      await loadMandapams()
      await refreshSelectedMandapam(m.id)
    } else {
      setActionError(res.error || 'Failed to update verification status.')
    }
  }

  const handleToggleFeatured = async (m: AdminMandapam) => {
    setActionError(null)
    setActionSuccess(null)

    const res = await featureAdminMandapam(m.id, !m.is_featured)

    if (res.success) {
      setActionSuccess(
        `${
          m.is_featured
            ? 'Featured status removed from'
            : 'Featured status added to'
        } ${m.name}.`
      )
      await loadMandapams()
      await refreshSelectedMandapam(m.id)
    } else {
      setActionError(res.error || 'Failed to update featured status.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setActionError(null)
    setActionSuccess(null)

    const res = await deleteAdminMandapam(id)

    if (res.success) {
      setActionSuccess(`Deleted "${name}".`)
      setInspectingMandapam(null)
      await loadMandapams()
    } else {
      setActionError(res.error || 'Failed to delete mandapam.')
    }
  }

  const openInspectModal = async (id: string) => {
    setIsLoadingInspect(true)
    const detailed = await fetchAdminMandapamById(id)
    setIsLoadingInspect(false)

    if (detailed) {
      setInspectingMandapam(detailed)
    }
  }

  const openEditModal = (m: AdminMandapam) => {
    setEditingMandapam(m)
    setEditForm({
      name: m.name,
      area: m.area,
      address: m.address || '',
      description: m.description || '',
      latitude: m.latitude.toString(),
      longitude: m.longitude.toString()
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingMandapam) return

    setIsSavingEdit(true)
    const res = await updateAdminMandapam(editingMandapam.id, {
      name: editForm.name.trim(),
      area: editForm.area.trim(),
      address: editForm.address.trim() || null,
      description: editForm.description.trim() || null,
      latitude: parseFloat(editForm.latitude),
      longitude: parseFloat(editForm.longitude)
    })

    setIsSavingEdit(false)

    if (res.success) {
      setActionSuccess(`Updated "${editForm.name}".`)
      setEditingMandapam(null)
      await loadMandapams()
      await refreshSelectedMandapam(editingMandapam.id)
    } else {
      setActionError(res.error || 'Failed to save changes.')
    }
  }

  const reviewSections = inspectingMandapam
    ? [
        {
          title: 'Submission',
          items: [
            { label: 'Association Name', value: inspectingMandapam.name },
            { label: 'Area', value: inspectingMandapam.area },
            { label: 'Location', value: inspectingMandapam.address },
            {
              label: 'Description',
              value: inspectingMandapam.description,
              fullWidth: true
            },
            {
              label: 'Submitted by',
              value: (inspectingMandapam as any).submitted_by || null
            }
          ]
        },
        {
          title: 'Contact',
          items: [
            {
              label: 'Phone',
              value: (inspectingMandapam as any).phone || null
            },
            {
              label: 'Email',
              value: (inspectingMandapam as any).email || null
            },
            {
              label: 'Website',
              value: (inspectingMandapam as any).website || null
            },
            {
              label: 'Social links',
              value: (inspectingMandapam as any).social_links || null
            }
          ]
        },
        {
          title: 'Festival Information',
          items: [
            {
              label: 'Festival dates',
              value: (inspectingMandapam as any).festival_dates || null
            },
            {
              label: 'Opening time',
              value: (inspectingMandapam as any).opening_time || null
            },
            {
              label: 'Closing time',
              value: (inspectingMandapam as any).closing_time || null
            },
            {
              label: 'Special information',
              value: (inspectingMandapam as any).special_information || null
            }
          ]
        },
        {
          title: 'Location',
          items: [
            {
              label: 'Latitude',
              value: Number.isFinite(inspectingMandapam.latitude)
                ? inspectingMandapam.latitude
                : null
            },
            {
              label: 'Longitude',
              value: Number.isFinite(inspectingMandapam.longitude)
                ? inspectingMandapam.longitude
                : null
            },
            {
              label: 'Map',
              value: `https://www.google.com/maps?q=${inspectingMandapam.latitude},${inspectingMandapam.longitude}`
            }
          ]
        }
      ]
        .map(section => ({
          ...section,
          items: section.items.filter(item => hasValue(item.value))
        }))
        .filter(section => section.items.length > 0)
    : []

  const reviewImages = (() => {
    if (!inspectingMandapam) return []

    const extraImages = Array.isArray((inspectingMandapam as any).images)
      ? (inspectingMandapam as any).images
          .map((image: any) => (typeof image === 'string' ? image : image?.url))
          .filter(Boolean)
      : []

    if (extraImages.length > 0) return extraImages

    const primaryImage =
      inspectingMandapam.signed_image_url || inspectingMandapam.image_url
    return primaryImage ? [primaryImage] : []
  })()

  const selectedReviewImage =
    reviewImages[selectedImageIndex] || reviewImages[0]

  return (
    <div className='min-h-screen bg-[var(--color-surface-muted)]'>
      <header className='sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-sm'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
          <div className='flex shrink-0 items-center gap-3'>
            <span className='text-2xl leading-none' aria-hidden='true'>
              🕉️
            </span>
            <span className='flex flex-col leading-none'>
              <span className='text-base font-bold text-[var(--color-text)]'>
                Ganesh Darshan
              </span>
              <span className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-dark)]'>
                Admin Moderation Console
              </span>
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <span className='rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-dark)]'>
              👤 {adminEmail}
            </span>
            <Link
              to='/'
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
              target='_blank'
              rel='noopener noreferrer'
            >
              🌐 View Public Site
            </Link>
            <button
              type='button'
              onClick={handleLogout}
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <h1 className='text-2xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-3xl'>
              Mandapam Moderation Queue
            </h1>
            <p className='mt-1 text-sm text-[var(--color-text-secondary)]'>
              Review submissions quickly, then move them through the moderation
              workflow.
            </p>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <label className='relative block'>
              <span className='sr-only'>Search mandapams</span>
              <input
                type='text'
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder='Search mandapams...'
                className='w-full rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] sm:w-64'
              />
            </label>

            <button
              type='button'
              onClick={() => loadMandapams()}
              className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div
            className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700'
            role='status'
          >
            ✓ {actionSuccess}
          </div>
        )}

        {actionError && (
          <div
            className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
            role='alert'
          >
            ⚠️ {actionError}
          </div>
        )}

        <div className='mb-5 flex gap-2 overflow-x-auto pb-1' role='tablist'>
          {tabs.map(tab => (
            <button
              key={tab.value}
              type='button'
              role='tab'
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeTab === tab.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
            <span className='text-5xl opacity-70' aria-hidden='true'>
              ⏳
            </span>
            <p className='text-base font-medium'>Loading moderation records…</p>
          </div>
        ) : filteredMandapams.length === 0 ? (
          <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-text-secondary)]'>
            <span className='text-5xl opacity-70' aria-hidden='true'>
              📭
            </span>
            <p className='text-base font-medium'>
              No {activeTab === 'all' ? 'records' : activeTab} mandapams found.
            </p>
          </div>
        ) : (
          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {filteredMandapams.map(m => {
              const image = getCardImage(m)

              return (
                <div
                  key={m.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => openInspectModal(m.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openInspectModal(m.id)
                    }
                  }}
                  className='flex cursor-pointer flex-col rounded-[18px] border border-[var(--color-border)] bg-white p-4 shadow-sm transition hover:border-[var(--color-border-strong)] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                >
                  <div className='mb-3 flex items-start justify-between gap-3'>
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]',
                        m.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : m.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      ].join(' ')}
                    >
                      {m.status}
                    </span>

                    <span className='text-[11px] font-medium text-[var(--color-text-muted)]'>
                      {formatDate(m.created_at)}
                    </span>
                  </div>

                  <div className='flex gap-3'>
                    <div className='h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]'>
                      {image ? (
                        <img
                          src={image}
                          alt={m.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-xl text-[var(--color-text-muted)]'>
                          🖼️
                        </div>
                      )}
                    </div>

                    <div className='min-w-0 flex-1'>
                      <h3 className='text-base font-bold text-[var(--color-text)]'>
                        {m.name}
                      </h3>

                      <p className='mt-1 text-sm font-semibold text-[var(--color-primary-dark)]'>
                        📍 {m.area}
                      </p>

                      {m.address && (
                        <p className='mt-1 text-xs text-[var(--color-text-secondary)]'>
                          {m.address}
                        </p>
                      )}

                      {(m.is_verified || m.is_featured) && (
                        <div className='mt-2 flex flex-wrap gap-1'>
                          {m.is_verified && (
                            <span className='rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'>
                              Verified
                            </span>
                          )}
                          {m.is_featured && (
                            <span className='rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700'>
                              Featured
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3'>
                    <span className='text-[11px] font-medium text-[var(--color-text-muted)]'>
                      Quick review
                    </span>
                    <button
                      type='button'
                      onClick={event => {
                        event.stopPropagation()
                        openInspectModal(m.id)
                      }}
                      className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
                    >
                      Review →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {inspectingMandapam && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-4'
          onClick={() => setInspectingMandapam(null)}
        >
          <div
            className='h-[min(820px,calc(100vh-32px))] w-full max-w-[1180px] overflow-hidden rounded-[24px] border border-[#E7E7E7] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out'
            onClick={event => event.stopPropagation()}
          >
            <div className='flex h-full min-h-0 flex-col'>
              <header className='flex items-start justify-between gap-4 border-b border-[#E7E7E7] px-5 py-4 sm:px-6 lg:px-8'>
                <div>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]'>
                    Review Mandapam
                  </p>
                  <h2 className='mt-1 text-2xl font-bold tracking-[-0.03em] text-[#171717]'>
                    {inspectingMandapam.name}
                  </h2>
                </div>

                <div className='flex items-center gap-3'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]',
                        inspectingMandapam.status === 'pending'
                          ? 'bg-[#f2e7d5] text-[#8a5c1a]'
                          : inspectingMandapam.status === 'approved'
                          ? 'bg-[#dff6e8] text-[#166534]'
                          : 'bg-[#f6d7d7] text-[#8a1f1f]'
                      ].join(' ')}
                    >
                      {inspectingMandapam.status}
                    </span>
                    {inspectingMandapam.is_verified && (
                      <span className='inline-flex items-center rounded-full bg-[#eaf5ee] px-2 py-0.5 text-[10px] font-semibold text-[#1b5c42]'>
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <button
                    type='button'
                    aria-label='Close review modal'
                    onClick={() => setInspectingMandapam(null)}
                    className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-xl leading-none text-[#6A6A6A] transition hover:bg-[#F5F5F5] hover:text-[#171717]'
                  >
                    ×
                  </button>
                </div>
              </header>

              {isLoadingInspect ? (
                <div className='flex min-h-[320px] items-center justify-center text-sm text-[#6A6A6A]'>
                  Loading submission details…
                </div>
              ) : (
                <>
                  <div className='flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row'>
                    <div className='flex min-h-0 flex-col border-b border-[#E7E7E7] bg-[#F7F7F5] p-4 sm:p-5 lg:max-w-[46%] lg:flex-[0_0_46%] lg:border-b-0 lg:border-r'>
                      <div className='flex h-full min-h-[280px] flex-col overflow-hidden rounded-[18px] border border-[#E7E7E7] bg-white'>
                        {selectedReviewImage ? (
                          <img
                            src={selectedReviewImage}
                            alt={inspectingMandapam.name}
                            className='h-[380px] w-full object-contain bg-white sm:h-[440px] lg:h-full'
                          />
                        ) : (
                          <div className='flex h-full min-h-[280px] items-center justify-center text-center text-[#6A6A6A]'>
                            <div>
                              <div className='text-5xl'>🕉️</div>
                              <p className='mt-2 text-sm'>No photo uploaded</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {reviewImages.length > 1 && (
                        <div className='mt-4 flex flex-wrap gap-2'>
                          {reviewImages.map((image: string, index: number) => (
                            <button
                              key={`${image}-${index}`}
                              type='button'
                              onClick={() => setSelectedImageIndex(index)}
                              className={[
                                'h-16 w-16 overflow-hidden rounded-xl border bg-white transition',
                                selectedImageIndex === index
                                  ? 'border-[#171717] ring-2 ring-[#171717]/10'
                                  : 'border-[#E5E5E5] hover:border-[#BDBDBD]'
                              ].join(' ')}
                              aria-label={`View image ${index + 1}`}
                            >
                              <img
                                src={image}
                                alt={`${inspectingMandapam.name} image ${
                                  index + 1
                                }`}
                                className='h-full w-full object-cover'
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className='min-h-0 flex-1 overflow-y-auto bg-white overscroll-contain'>
                      <div className='space-y-6 px-5 py-5 sm:px-6 lg:px-8'>
                        {reviewSections.map(section => (
                          <section
                            key={section.title}
                            className='border-b border-[#E7E7E7] pb-6 last:border-b-0 last:pb-0'
                          >
                            <h3 className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]'>
                              {section.title}
                            </h3>

                            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                              {section.items.map(item => {
                                const isFullWidth = item.fullWidth
                                const value = item.value

                                if (!hasValue(value)) return null

                                return (
                                  <div
                                    key={item.label}
                                    className={
                                      isFullWidth ? 'sm:col-span-2' : 'min-w-0'
                                    }
                                  >
                                    <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]'>
                                      {item.label}
                                    </p>

                                    {item.label === 'Map' ? (
                                      <a
                                        href={String(value)}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='mt-1 inline-flex text-[15px] text-[#171717] underline-offset-2 hover:underline'
                                      >
                                        Open in Google Maps
                                      </a>
                                    ) : item.label === 'Description' ? (
                                      <p className='mt-1 text-[15px] leading-7 text-[#171717]'>
                                        {typeof value === 'string'
                                          ? value
                                          : String(value)}
                                      </p>
                                    ) : (
                                      <p className='mt-1 text-[15px] leading-6 text-[#171717]'>
                                        {typeof value === 'string'
                                          ? value
                                          : String(value)}
                                      </p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </section>
                        ))}

                        <details className='overflow-hidden rounded-[16px] border border-[#E7E7E7] bg-[#F7F7F5]'>
                          <summary className='cursor-pointer list-none px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]'>
                            Technical details
                          </summary>

                          <div className='grid gap-4 border-t border-[#E7E7E7] px-4 py-4 sm:grid-cols-2'>
                            <div>
                              <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]'>
                                Record ID
                              </p>
                              <p className='mt-1 text-[15px] text-[#171717]'>
                                {inspectingMandapam.id}
                              </p>
                            </div>
                            <div>
                              <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]'>
                                Created
                              </p>
                              <p className='mt-1 text-[15px] text-[#171717]'>
                                {formatDateTime(inspectingMandapam.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]'>
                                Updated
                              </p>
                              <p className='mt-1 text-[15px] text-[#171717]'>
                                {formatDateTime(inspectingMandapam.updated_at)}
                              </p>
                            </div>
                            <div>
                              <p className='text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]'>
                                Image path
                              </p>
                              <p className='mt-1 break-all text-[15px] text-[#171717]'>
                                {inspectingMandapam.image_url ||
                                  'No image path'}
                              </p>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>

                  <div className='flex-shrink-0 border-t border-[#E7E7E7] bg-white p-4 sm:p-5'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => openEditModal(inspectingMandapam)}
                        className='inline-flex items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-semibold text-[#222222] transition hover:bg-[#F5F5F5]'
                      >
                        Edit
                      </button>

                      {inspectingMandapam.status === 'pending' ? (
                        <>
                          <button
                            type='button'
                            onClick={() => handleApprove(inspectingMandapam.id)}
                            className='inline-flex items-center justify-center rounded-full bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2B2B2B]'
                          >
                            Approve
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              handleReject(
                                inspectingMandapam.id,
                                inspectingMandapam.name
                              )
                            }
                            className='inline-flex items-center justify-center rounded-full border border-[#F1C0C0] bg-white px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF1F1]'
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type='button'
                            onClick={() =>
                              handleToggleVerified(inspectingMandapam)
                            }
                            className='inline-flex items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-semibold text-[#222222] transition hover:bg-[#F5F5F5]'
                          >
                            {inspectingMandapam.is_verified
                              ? 'Unverify'
                              : 'Verify'}
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              handleToggleFeatured(inspectingMandapam)
                            }
                            className='inline-flex items-center justify-center rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-sm font-semibold text-[#222222] transition hover:bg-[#F5F5F5]'
                          >
                            {inspectingMandapam.is_featured
                              ? 'Unfeature'
                              : 'Feature'}
                          </button>
                          <button
                            type='button'
                            onClick={() =>
                              handleReject(
                                inspectingMandapam.id,
                                inspectingMandapam.name
                              )
                            }
                            className='inline-flex items-center justify-center rounded-full border border-[#F1C0C0] bg-white px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF1F1]'
                          >
                            {inspectingMandapam.status === 'approved'
                              ? 'Revoke'
                              : 'Reject'}
                          </button>
                        </>
                      )}

                      <button
                        type='button'
                        onClick={() =>
                          handleDelete(
                            inspectingMandapam.id,
                            inspectingMandapam.name
                          )
                        }
                        className='ml-auto inline-flex items-center justify-center rounded-full border border-[#F1C0C0] bg-[#FFF1F1] px-4 py-2 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFE1E1]'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editingMandapam && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'
          onClick={() => setEditingMandapam(null)}
        >
          <div
            className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl'
            onClick={event => event.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4'>
              <h2 className='text-lg font-bold text-[var(--color-text)]'>
                Edit Mandapam Metadata
              </h2>
              <button
                type='button'
                className='text-xl text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]'
                onClick={() => setEditingMandapam(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className='space-y-4 p-5'>
              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Association Name *
                </label>
                <input
                  type='text'
                  value={editForm.name}
                  onChange={e =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Area / Locality *
                </label>
                <input
                  type='text'
                  value={editForm.area}
                  onChange={e =>
                    setEditForm({ ...editForm, area: e.target.value })
                  }
                  required
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Address
                </label>
                <input
                  type='text'
                  value={editForm.address}
                  onChange={e =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-bold text-[var(--color-text)]'>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <label className='text-sm font-bold text-[var(--color-text)]'>
                    Latitude *
                  </label>
                  <input
                    type='number'
                    step='any'
                    value={editForm.latitude}
                    onChange={e =>
                      setEditForm({ ...editForm, latitude: e.target.value })
                    }
                    required
                    className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                  />
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-bold text-[var(--color-text)]'>
                    Longitude *
                  </label>
                  <input
                    type='number'
                    step='any'
                    value={editForm.longitude}
                    onChange={e =>
                      setEditForm({ ...editForm, longitude: e.target.value })
                    }
                    required
                    className='w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)]'
                  />
                </div>
              </div>

              <div className='flex justify-end gap-3 border-t border-[var(--color-border)] pt-4'>
                <button
                  type='button'
                  onClick={() => setEditingMandapam(null)}
                  className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSavingEdit}
                  className='inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60'
                  aria-busy={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
