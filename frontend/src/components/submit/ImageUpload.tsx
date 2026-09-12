import { useState, useRef, useEffect, ChangeEvent } from 'react'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

interface ImageUploadProps {
  file: File | null
  onFileChange: (file: File | null) => void
  error?: string | null
}

export function ImageUpload ({ file, onFileChange, error }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const validateAndSetFile = (selectedFile: File | null) => {
    setValidationError(null)

    // Clean up previous preview URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    if (!selectedFile) {
      setPreviewUrl(null)
      onFileChange(null)
      return
    }

    // Check size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('Image exceeds 5 MB. Please select a smaller photo.')
      setPreviewUrl(null)
      onFileChange(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      setValidationError(
        'Invalid image format. Only JPEG, PNG, and WebP images are allowed.'
      )
      setPreviewUrl(null)
      onFileChange(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Check file extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        'Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp'
      )
      setPreviewUrl(null)
      onFileChange(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const newUrl = URL.createObjectURL(selectedFile)
    objectUrlRef.current = newUrl
    setPreviewUrl(newUrl)
    onFileChange(selectedFile)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    validateAndSetFile(selected)
  }

  const handleRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPreviewUrl(null)
    onFileChange(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayError = validationError || error

  return (
    <div className='flex flex-col gap-2'>
      <input
        ref={fileInputRef}
        type='file'
        id='mandapam-photo'
        accept='.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
        onChange={handleInputChange}
        className='sr-only'
        aria-label='Upload mandapam photo'
      />

      {!previewUrl ? (
        <label
          htmlFor='mandapam-photo'
          className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-center transition hover:border-[var(--color-border-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-soft)]'
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
        >
          <span className='text-3xl leading-none' aria-hidden='true'>
            📷
          </span>
          <span className='text-sm font-semibold text-[var(--color-text)]'>
            Click to upload photo
          </span>
          <span className='text-xs text-[var(--color-text-muted)]'>
            JPEG, PNG, or WebP • Max 5 MB
          </span>
        </label>
      ) : (
        <div className='flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3'>
          <img
            src={previewUrl}
            alt='Selected mandapam preview'
            className='h-20 w-20 rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover'
          />
          <div className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-semibold text-[var(--color-text)]'>
              {file?.name}
            </span>
            <span className='text-xs text-[var(--color-text-muted)]'>
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}
            </span>
            <div className='mt-2 flex flex-wrap gap-2'>
              <label
                htmlFor='mandapam-photo'
                className='inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-border-strong)]'
              >
                Change Photo
              </label>
              <button
                type='button'
                onClick={handleRemove}
                className='inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50'
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {displayError && (
        <p className='text-sm font-semibold text-red-600' role='alert'>
          {displayError}
        </p>
      )}
    </div>
  )
}
