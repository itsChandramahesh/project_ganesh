import ganesh01 from '../Assets/ganesh01.jpg'
import ganesh02 from '../Assets/ganesh02.jpg'
import ganesh03 from '../Assets/ganesh03.jpg'
import ganesh04 from '../Assets/ganesh04.jpg'
import ganesh05 from '../Assets/ganesh05.jpg'
import ganesh06 from '../Assets/ganesh06.jpg'
import ganesh07 from '../Assets/ganesh07.jpg'
import ganesh08 from '../Assets/ganesh08.jpg'

const FALLBACK_IMAGES = [
  ganesh01,
  ganesh02,
  ganesh03,
  ganesh04,
  ganesh05,
  ganesh06,
  ganesh07,
  ganesh08
]

export function getFallbackImageUrl (seed?: string | number): string {
  const raw = String(seed ?? 'ganesh-darshan')
  let hash = 0

  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  }

  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length]
}

/**
 * Resolves an image URL for display in standard <img> tags.
 * Falls back to a local Ganesh sample asset when the uploaded/remote URL is missing,
 * invalid, or not safely displayable.
 */
export function resolveImageUrl (
  url: string | null | undefined,
  seed?: string | number
): string {
  if (!url || typeof url !== 'string') {
    return getFallbackImageUrl(seed)
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return getFallbackImageUrl(seed)
  }

  // 1. Full absolute web URLs (HTTP / HTTPS)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // 2. Local public assets starting with leading slash (e.g. /images/mandapam.jpg)
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // 3. Storage object paths (e.g. "submissions/{uuid}.jpg") are not directly
  // safe to render without auth/signing, so fall back to the bundled sample art.
  return getFallbackImageUrl(seed)
}
