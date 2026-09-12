import { useState } from 'react'

interface ShareButtonProps {
  mandapamName: string
  area: string
  description?: string | null
  imageUrl?: string | null
  shareUrl?: string | null
  directionsUrl?: string | null
  className?: string
}

function escapeHtml (value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function ShareButton ({
  mandapamName,
  area,
  description,
  imageUrl,
  shareUrl,
  directionsUrl,
  className = 'btn btn-secondary'
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const resolvedShareUrl =
    shareUrl || (typeof window !== 'undefined' ? window.location.href : '')
  const resolvedImageUrl = imageUrl || ''

  const shareTitle = `${mandapamName} — Ganesh Mandapam Hyderabad`

  const shareText = [
    `Check out ${mandapamName} in ${area}, Hyderabad.`,
    description?.trim() ? description.trim() : '',
    `View details: ${resolvedShareUrl}`
  ]
    .filter(Boolean)
    .join('\n\n')

  const getShareFile = async (): Promise<File | null> => {
    if (!resolvedImageUrl) return null

    try {
      const response = await fetch(resolvedImageUrl)
      if (!response.ok) return null

      const blob = await response.blob()
      if (!blob.size) return null

      const mimeType = blob.type || 'image/jpeg'
      const extension = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('webp')
        ? 'webp'
        : 'jpg'

      return new File(
        [blob],
        `${mandapamName.replace(/\s+/g, '-').toLowerCase()}.${extension}`,
        {
          type: mimeType
        }
      )
    } catch (err) {
      console.error('Failed to fetch image for sharing:', err)
      return null
    }
  }

  const shareHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; background: #ffffff; color: #111827;">
      <img src="${escapeHtml(resolvedImageUrl)}" alt="${escapeHtml(
    mandapamName
  )}" style="display:block; width:100%; max-height:260px; object-fit:cover; background:#f3f4f6;" />
      <div style="padding: 18px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">Ganesh Mandapam</div>
        <h2 style="margin: 0 0 8px; font-size: 24px; line-height: 1.2; color: #111827;">${escapeHtml(
          mandapamName
        )}</h2>
        <p style="margin: 0; color: #374151; font-size: 15px;">${escapeHtml(
          area
        )}, Hyderabad</p>
        ${
          description?.trim()
            ? `<p style="margin: 12px 0 0; color: #4b5563; line-height: 1.6; font-size: 14px;">${escapeHtml(
                description.trim()
              )}</p>`
            : ''
        }
        <p style="margin: 16px 0 0;"><a href="${escapeHtml(
          resolvedShareUrl
        )}" style="color: #1d4ed8; font-weight: 700; text-decoration: none;">View details</a></p>
      </div>
    </div>
  `

  const copyToClipboard = async () => {
    try {
      const plainText = `${shareTitle}\n\n${shareText}`

      if (navigator.clipboard && window.ClipboardItem) {
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([shareHtml], { type: 'text/html' })
        })

        await navigator.clipboard.write([clipboardItem])
      } else {
        await navigator.clipboard.writeText(plainText)
      }

      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy share card:', err)
      try {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        console.error('Failed to fallback copy to clipboard:', err)
      }
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const shareFile = await getShareFile()

        if (
          shareFile &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [shareFile] })
        ) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: resolvedShareUrl,
            files: [shareFile]
          })
          return
        }

        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: resolvedShareUrl
        })
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return
        }
      }
    }

    await copyToClipboard()
  }

  return (
    <button
      type='button'
      onClick={handleShare}
      className={className}
      aria-label={`Share ${mandapamName}`}
    >
      {copied ? '✓ Share card copied!' : '↗ Share'}
    </button>
  )
}
