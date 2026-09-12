import { Request, Response } from 'express'
import {
  createMandapamSubmission as createMandapamSubmissionService,
  getMandapamById as getMandapamByIdService,
  listApprovedMandapams,
  listFeaturedMandapams,
  MandapamServiceError
} from '../services/mandapamService.js'

function handleServiceError (
  res: Response,
  error: unknown,
  fallbackMessage = 'Internal server error.'
): void {
  if (error instanceof MandapamServiceError) {
    res.status(error.status).json({ success: false, error: error.message })
    return
  }

  console.error('[mandapams.controller] Unexpected error:', error)
  res.status(500).json({ success: false, error: fallbackMessage })
}

/**
 * GET /api/mandapams
 * Returns all approved mandapams with optional search & area filtering.
 */
export async function getApprovedMandapams (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { area, search } = req.query
    const data = await listApprovedMandapams(
      typeof area === 'string' ? area : undefined,
      typeof search === 'string' ? search : undefined
    )

    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    res.json({ success: true, data })
  } catch (error) {
    console.error('[mandapams.controller] getApprovedMandapams error:', error)
    res.json({ success: true, data: [] })
  }
}

/**
 * GET /api/mandapams/featured
 * Returns featured mandapams, falling back to recent approved if none featured.
 */
export async function getFeaturedMandapams (
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await listFeaturedMandapams()
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    res.json({ success: true, data })
  } catch (error) {
    console.error('[mandapams.controller] getFeaturedMandapams error:', error)
    res.json({ success: true, data: [] })
  }
}

/**
 * GET /api/mandapams/:id
 * Fetches a single approved mandapam by UUID.
 */
export async function getMandapamById (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    const data = await getMandapamByIdService(id ?? '')

    res.set('Cache-Control', 'public, max-age=60')
    res.json({ success: true, data })
  } catch (error) {
    handleServiceError(res, error, 'Failed to fetch mandapam details.')
  }
}

/**
 * POST /api/mandapams
 * Submits a new mandapam listing (multipart form data with optional image).
 */
export async function createMandapamSubmission (
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      name,
      area,
      address,
      description,
      latitude,
      longitude,
      submitted_by
    } = req.body

    if (!name || !String(name).trim()) {
      res
        .status(400)
        .json({ success: false, error: 'Association name is required' })
      return
    }

    const trimmedName = String(name).trim()
    if (trimmedName.length > 150) {
      res.status(400).json({
        success: false,
        error: 'Association name must not exceed 150 characters.'
      })
      return
    }

    if (!area || !String(area).trim()) {
      res
        .status(400)
        .json({ success: false, error: 'Area/Neighborhood is required' })
      return
    }

    const trimmedArea = String(area).trim()
    if (trimmedArea.length > 100) {
      res
        .status(400)
        .json({ success: false, error: 'Area must not exceed 100 characters.' })
      return
    }

    const trimmedAddress = address ? String(address).trim() : null
    if (trimmedAddress && trimmedAddress.length > 300) {
      res.status(400).json({
        success: false,
        error: 'Address must not exceed 300 characters.'
      })
      return
    }

    const trimmedDescription = description ? String(description).trim() : null
    if (trimmedDescription && trimmedDescription.length > 2000) {
      res.status(400).json({
        success: false,
        error: 'Description must not exceed 2000 characters.'
      })
      return
    }

    const trimmedSubmittedBy = submitted_by ? String(submitted_by).trim() : null
    if (trimmedSubmittedBy && trimmedSubmittedBy.length > 150) {
      res.status(400).json({
        success: false,
        error: 'Submitted by must not exceed 150 characters.'
      })
      return
    }

    const lat = Number(latitude)
    const lng = Number(longitude)

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({
        success: false,
        error: 'Valid latitude between -90 and 90 is required.'
      })
      return
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: 'Valid longitude between -180 and 180 is required.'
      })
      return
    }

    const created = await createMandapamSubmissionService(
      {
        name: trimmedName,
        area: trimmedArea,
        address: trimmedAddress,
        description: trimmedDescription,
        latitude: lat,
        longitude: lng,
        submitted_by: trimmedSubmittedBy
      },
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            buffer: req.file.buffer
          }
        : undefined
    )

    res.status(201).json({
      success: true,
      message: 'Mandapam submitted successfully!',
      data: created
    })
  } catch (error) {
    handleServiceError(
      res,
      error,
      'Internal server error while saving submission'
    )
  }
}
