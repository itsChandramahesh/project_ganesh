import { useState, useId, useRef } from 'react'
import { LocationPicker } from '../map/LocationPicker'
import { ImageUpload } from './ImageUpload'
import { SubmissionSuccess } from './SubmissionSuccess'
import { submitMandapam } from '../../services/api'

const HYDERABAD_AREAS = [
  'Ameerpet',
  'Banjara Hills',
  'Begumpet',
  'Charminar / Old City',
  'Dilsukhnagar',
  'Gachibowli',
  'Hitec City',
  'Jubilee Hills',
  'Khairatabad',
  'Kondapur',
  'Kothapet',
  'Kukatpally',
  'LB Nagar',
  'Madhapur',
  'Mehdipatnam',
  'Miyapur',
  'Nallakunta',
  'RTC X Roads',
  'Secunderabad',
  'Somajiguda',
  'SR Nagar',
  'Tarnaka',
  'Uppal'
]

interface FormErrors {
  name?: string
  area?: string
  location?: string
  address?: string
  description?: string
  image?: string
}

export function SubmitMandapamForm () {
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  )
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const isSubmittingRef = useRef(false)

  const nameInputId = useId()
  const addressInputId = useId()
  const descInputId = useId()

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = 'Association name is required.'
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters.'
    } else if (trimmedName.length > 120) {
      newErrors.name = 'Name must be 120 characters or fewer.'
    }

    const trimmedArea = area.trim()
    if (!trimmedArea) {
      newErrors.area = 'Area is required.'
    } else if (trimmedArea.length < 2) {
      newErrors.area = 'Area must be at least 2 characters.'
    } else if (trimmedArea.length > 100) {
      newErrors.area = 'Area must be 100 characters or fewer.'
    }

    if (!location) {
      newErrors.location = 'Please pin the mandapam location on the map.'
    } else {
      if (location.lat < -90 || location.lat > 90) {
        newErrors.location = 'Latitude must be between -90 and 90.'
      }
      if (location.lng < -180 || location.lng > 180) {
        newErrors.location = 'Longitude must be between -180 and 180.'
      }
    }

    if (address && address.length > 300) {
      newErrors.address = 'Address must be 300 characters or fewer.'
    }

    if (description && description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or fewer.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmittingRef.current) {
      return
    }

    setSubmitError(null)

    if (!validate()) {
      const firstErrorEl = document.querySelector('.form-error')
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    if (!location) return

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('area', area.trim())
      if (address.trim()) formData.append('address', address.trim())
      if (description.trim()) formData.append('description', description.trim())
      formData.append('latitude', location.lat.toString())
      formData.append('longitude', location.lng.toString())
      if (imageFile) {
        formData.append('imageFile', imageFile)
      }

      const result = await submitMandapam(formData)

      if (!result.success) {
        setSubmitError(
          result.error ||
            'Unable to submit mandapam. Please check your network and try again.'
        )
        return
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error('[SubmitMandapamForm] Submission error:', err)
      setSubmitError(
        'An unexpected error occurred while submitting. Please try again.'
      )
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    isSubmittingRef.current = false
    setName('')
    setArea('')
    setAddress('')
    setDescription('')
    setLocation(null)
    setImageFile(null)
    setErrors({})
    setSubmitError(null)
    setIsSubmitted(false)
  }

  if (isSubmitted) {
    return <SubmissionSuccess onReset={handleReset} />
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 sm:p-7'
      noValidate
    >
      {submitError && (
        <div
          className='mb-5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
          role='alert'
        >
          ⚠️ {submitError}
        </div>
      )}

      <div className='space-y-5'>
        <div className='space-y-2'>
          <label
            htmlFor={nameInputId}
            className='flex items-center gap-1 text-sm font-bold text-[var(--color-text)]'
          >
            Association Name <span className='text-red-600'>*</span>
          </label>
          <input
            id={nameInputId}
            type='text'
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
            }}
            placeholder='e.g. Khairatabad Ganesh Utsava Samithi'
            maxLength={120}
            className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] ${
              errors.name ? 'border-red-300' : 'border-[var(--color-border)]'
            }`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            required
          />
          {errors.name && (
            <p
              id='name-error'
              className='text-sm font-semibold text-red-600'
              role='alert'
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <label className='flex items-center gap-1 text-sm font-bold text-[var(--color-text)]'>
            Location <span className='text-red-600'>*</span>
          </label>
          <LocationPicker
            selectedLocation={location}
            selectedArea={area}
            onAreaChange={value => {
              setArea(value)
              if (errors.area) setErrors(prev => ({ ...prev, area: undefined }))
            }}
            areas={HYDERABAD_AREAS}
            onLocationSelect={coords => {
              setLocation(coords)
              if (errors.location) {
                setErrors(prev => ({ ...prev, location: undefined }))
              }
            }}
            error={errors.location}
          />
          {errors.area && (
            <p
              id='area-error'
              className='text-sm font-semibold text-red-600'
              role='alert'
            >
              {errors.area}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <label
            htmlFor={addressInputId}
            className='flex items-center gap-1 text-sm font-bold text-[var(--color-text)]'
          >
            Full Address{' '}
            <span className='text-xs font-normal text-[var(--color-text-muted)]'>
              (optional)
            </span>
          </label>
          <input
            id={addressInputId}
            type='text'
            value={address}
            onChange={e => {
              setAddress(e.target.value)
              if (errors.address) {
                setErrors(prev => ({ ...prev, address: undefined }))
              }
            }}
            placeholder='e.g. Near Library, Main Road, Khairatabad'
            maxLength={300}
            className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] ${
              errors.address ? 'border-red-300' : 'border-[var(--color-border)]'
            }`}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? 'address-error' : undefined}
          />
          {errors.address && (
            <p
              id='address-error'
              className='text-sm font-semibold text-red-600'
              role='alert'
            >
              {errors.address}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <label className='flex items-center gap-1 text-sm font-bold text-[var(--color-text)]'>
            Mandapam Photo{' '}
            <span className='text-xs font-normal text-[var(--color-text-muted)]'>
              (optional)
            </span>
          </label>
          <ImageUpload
            file={imageFile}
            onFileChange={f => {
              setImageFile(f)
              if (errors.image)
                setErrors(prev => ({ ...prev, image: undefined }))
            }}
            error={errors.image}
          />
        </div>

        <div className='space-y-2'>
          <label
            htmlFor={descInputId}
            className='flex items-center gap-1 text-sm font-bold text-[var(--color-text)]'
          >
            About this Mandapam{' '}
            <span className='text-xs font-normal text-[var(--color-text-muted)]'>
              (optional)
            </span>
          </label>
          <textarea
            id={descInputId}
            rows={3}
            value={description}
            onChange={e => {
              setDescription(e.target.value)
              if (errors.description) {
                setErrors(prev => ({ ...prev, description: undefined }))
              }
            }}
            placeholder='Tell visitors a little about this mandapam, theme, or special darshan timings...'
            maxLength={1000}
            className={`w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary-soft)] ${
              errors.description
                ? 'border-red-300'
                : 'border-[var(--color-border)]'
            }`}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'desc-error' : undefined}
          />
          <div className='text-right text-xs text-[var(--color-text-muted)]'>
            {description.length}/1000 characters
          </div>
          {errors.description && (
            <p
              id='desc-error'
              className='text-sm font-semibold text-red-600'
              role='alert'
            >
              {errors.description}
            </p>
          )}
        </div>

        <div className='space-y-3 pt-1'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded-full bg-[var(--color-primary)] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60'
            aria-busy={isSubmitting}
          >
            {isSubmitting ? '⏳ Submitting…' : 'Submit Mandapam'}
          </button>
          <p className='text-center text-xs text-[var(--color-text-muted)]'>
            Submissions are reviewed by our community team before appearing
            publicly.
          </p>
        </div>
      </div>
    </form>
  )
}
