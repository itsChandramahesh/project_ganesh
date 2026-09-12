import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { getAdminJwtSecret } from '../config/envValidation.js'
import {
  approveMandapam as approveMandapamService,
  deleteMandapam as deleteMandapamService,
  getAdminMandapamById as getAdminMandapamByIdService,
  listAdminMandapams,
  MandapamServiceError,
  rejectMandapam as rejectMandapamService,
  setMandapamBooleanFlag,
  updateMandapam as updateMandapamService
} from '../services/mandapamService.js'

function getRouteId (req: Request): string {
  const rawId = req.params.id
  return Array.isArray(rawId) ? rawId[0] : rawId ?? ''
}

function handleServiceError (
  res: Response,
  error: unknown,
  fallbackMessage = 'Internal server error.'
): void {
  if (error instanceof MandapamServiceError) {
    res.status(error.status).json({ success: false, error: error.message })
    return
  }

  console.error('[Admin] Unexpected error:', error)
  res.status(500).json({ success: false, error: fallbackMessage })
}

/**
 * POST /api/admin/login
 * Validates admin credentials and issues a secure HTTP-only session cookie.
 */
export async function adminLogin (req: Request, res: Response): Promise<void> {
  const { email, password } = req.body

  const configuredEmail = process.env.ADMIN_EMAIL?.trim()
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim()

  if (!email || !password) {
    res
      .status(400)
      .json({ success: false, error: 'Email and password are required.' })
    return
  }

  if (
    !configuredEmail ||
    !configuredPassword ||
    email !== configuredEmail ||
    password !== configuredPassword
  ) {
    res
      .status(401)
      .json({ success: false, error: 'Invalid admin credentials.' })
    return
  }

  let jwtSecret: string
  try {
    jwtSecret = getAdminJwtSecret()
  } catch {
    res
      .status(500)
      .json({ success: false, error: 'Authentication configuration error.' })
    return
  }

  const token = jwt.sign({ email, role: 'admin' }, jwtSecret, {
    expiresIn: '8h'
  })

  const isProduction = process.env.NODE_ENV === 'production'

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000
  })

  console.log(`[Admin Auth] Admin user '${email}' logged in successfully.`)

  res.json({
    success: true,
    message: 'Logged in successfully.',
    admin: { email }
  })
}

/**
 * POST /api/admin/logout
 * Clears the admin session cookie.
 */
export async function adminLogout (_req: Request, res: Response): Promise<void> {
  res.clearCookie('admin_token', {
    httpOnly: true,
    sameSite: 'lax'
  })
  res.json({ success: true, message: 'Logged out successfully.' })
}

/**
 * GET /api/admin/me
 * Returns current authenticated admin profile.
 */
export async function getAdminProfile (
  req: Request,
  res: Response
): Promise<void> {
  if (!req.admin) {
    res.status(401).json({ success: false, error: 'Unauthorized.' })
    return
  }

  res.json({ success: true, admin: req.admin })
}

/**
 * GET /api/admin/mandapams
 * Lists mandapams filtered by status (pending, approved, rejected, all).
 */
export async function getAdminMandapams (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined
    const data = await listAdminMandapams(status)

    res.json({ success: true, data })
  } catch (error) {
    handleServiceError(res, error, 'Failed to fetch mandapams.')
  }
}

/**
 * GET /api/admin/mandapams/:id
 * Fetches full mandapam detail, generating a short-lived signed image URL
 * if a private storage object is present.
 */
export async function getAdminMandapamById (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = getRouteId(req)
    const data = await getAdminMandapamByIdService(id)

    res.json({ success: true, data })
  } catch (error) {
    handleServiceError(res, error, 'Failed to fetch mandapam details.')
  }
}

/**
 * PATCH /api/admin/mandapams/:id
 * Allows admin to edit listing metadata. Blocks editing id, created_at, or moderation fields.
 */
export async function updateMandapam (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, area, address, description, latitude, longitude } = req.body
    const updates: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, error: 'Name cannot be empty.' })
        return
      }

      const trimmedName = name.trim()
      if (trimmedName.length > 150) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Name must not exceed 150 characters.'
          })
        return
      }

      updates.name = trimmedName
    }

    if (area !== undefined) {
      if (typeof area !== 'string' || !area.trim()) {
        res.status(400).json({ success: false, error: 'Area cannot be empty.' })
        return
      }

      const trimmedArea = area.trim()
      if (trimmedArea.length > 100) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Area must not exceed 100 characters.'
          })
        return
      }

      updates.area = trimmedArea
    }

    if (address !== undefined) {
      const trimmedAddress = address ? String(address).trim() : ''
      if (trimmedAddress.length > 300) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Address must not exceed 300 characters.'
          })
        return
      }
      updates.address = trimmedAddress || null
    }

    if (description !== undefined) {
      const trimmedDesc = description ? String(description).trim() : ''
      if (trimmedDesc.length > 2000) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Description must not exceed 2000 characters.'
          })
        return
      }
      updates.description = trimmedDesc || null
    }

    if (latitude !== undefined) {
      const lat = Number(latitude)
      if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Valid latitude between -90 and 90 is required.'
          })
        return
      }
      updates.latitude = lat
    }

    if (longitude !== undefined) {
      const lng = Number(longitude)
      if (Number.isNaN(lng) || lng < -180 || lng > 180) {
        res
          .status(400)
          .json({
            success: false,
            error: 'Valid longitude between -180 and 180 is required.'
          })
        return
      }
      updates.longitude = lng
    }

    if (Object.keys(updates).length === 0) {
      res
        .status(400)
        .json({ success: false, error: 'No valid fields provided for update.' })
      return
    }

    updates.updated_at = new Date().toISOString()

    const id = getRouteId(req)
    const data = await updateMandapamService(id, updates)

    console.log(`[Admin Action] Admin updated mandapam details for ID: ${id}`)
    res.json({ success: true, message: 'Mandapam updated successfully.', data })
  } catch (error) {
    handleServiceError(res, error, 'Failed to update mandapam.')
  }
}

/**
 * POST /api/admin/mandapams/:id/approve
 * Approves a mandapam submission so it becomes publicly visible.
 */
export async function approveMandapam (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = getRouteId(req)
    await approveMandapamService(id)
    console.log(`[Admin Action] Admin approved mandapam ID: ${id}`)
    res.json({ success: true, message: 'Mandapam approved successfully.' })
  } catch (error) {
    handleServiceError(res, error, 'Failed to approve mandapam.')
  }
}

/**
 * POST /api/admin/mandapams/:id/reject
 * Rejects a mandapam submission, hiding it from public visibility.
 */
export async function rejectMandapam (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = getRouteId(req)
    await rejectMandapamService(id)
    console.log(`[Admin Action] Admin rejected mandapam ID: ${id}`)
    res.json({ success: true, message: 'Mandapam rejected.' })
  } catch (error) {
    handleServiceError(res, error, 'Failed to reject mandapam.')
  }
}

/**
 * POST /api/admin/mandapams/:id/verify
 * Sets is_verified flag.
 */
export async function setVerifiedStatus (
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (typeof req.body.is_verified !== 'boolean') {
      res
        .status(400)
        .json({
          success: false,
          error: 'is_verified must be a boolean (true or false).'
        })
      return
    }

    const id = getRouteId(req)
    await setMandapamBooleanFlag(id, 'is_verified', req.body.is_verified)

    console.log(
      `[Admin Action] Admin set is_verified=${req.body.is_verified} for mandapam ID: ${id}`
    )
    res.json({
      success: true,
      message: `Mandapam verification set to ${req.body.is_verified}.`
    })
  } catch (error) {
    handleServiceError(res, error, 'Failed to update verification status.')
  }
}

/**
 * POST /api/admin/mandapams/:id/feature
 * Sets is_featured flag.
 */
export async function setFeaturedStatus (
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (typeof req.body.is_featured !== 'boolean') {
      res
        .status(400)
        .json({
          success: false,
          error: 'is_featured must be a boolean (true or false).'
        })
      return
    }

    const id = getRouteId(req)
    await setMandapamBooleanFlag(id, 'is_featured', req.body.is_featured)

    console.log(
      `[Admin Action] Admin set is_featured=${req.body.is_featured} for mandapam ID: ${id}`
    )
    res.json({
      success: true,
      message: `Mandapam featured set to ${req.body.is_featured}.`
    })
  } catch (error) {
    handleServiceError(res, error, 'Failed to update featured status.')
  }
}

/**
 * DELETE /api/admin/mandapams/:id
 * Permanently deletes a mandapam record and cleans up any uploaded storage photo.
 */
export async function deleteMandapam (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = getRouteId(req)
    await deleteMandapamService(id)
    console.log(`[Admin Action] Admin deleted mandapam ID: ${id}`)
    res.json({ success: true, message: 'Mandapam deleted successfully.' })
  } catch (error) {
    handleServiceError(res, error, 'Failed to delete mandapam record.')
  }
}
