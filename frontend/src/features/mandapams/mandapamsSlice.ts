import {
  createAsyncThunk,
  createSlice,
  type PayloadAction
} from '@reduxjs/toolkit'
import type { Mandapam } from '../../types/mandapam'
import {
  fetchFeaturedMandapams,
  fetchMandapamById,
  fetchMandapams
} from '../../services/api'

interface MandapamsState {
  allMandapams: Mandapam[]
  featuredMandapams: Mandapam[]
  singleMandapam: Mandapam | null
  loading: boolean
  loadingSingle: boolean
  error: string | null
  singleError: string | null
}

const initialState: MandapamsState = {
  allMandapams: [],
  featuredMandapams: [],
  singleMandapam: null,
  loading: false,
  loadingSingle: false,
  error: null,
  singleError: null
}

export const loadHomeMandapams = createAsyncThunk(
  'mandapams/loadHomeMandapams',
  async (_, { rejectWithValue }) => {
    try {
      const [all, featured] = await Promise.all([
        fetchMandapams(),
        fetchFeaturedMandapams()
      ])

      return {
        allMandapams: all,
        featuredMandapams: featured
      }
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to load mandapams')
    }
  }
)

export const loadMandapamById = createAsyncThunk(
  'mandapams/loadMandapamById',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await fetchMandapamById(id)
      return data
    } catch (error: any) {
      return rejectWithValue(
        error?.message || 'Failed to load mandapam details'
      )
    }
  }
)

const mandapamsSlice = createSlice({
  name: 'mandapams',
  initialState,
  reducers: {
    clearSingleMandapam: state => {
      state.singleMandapam = null
      state.singleError = null
    },
    setSingleMandapam: (state, action: PayloadAction<Mandapam | null>) => {
      state.singleMandapam = action.payload
    }
  },
  extraReducers: builder => {
    builder
      .addCase(loadHomeMandapams.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(loadHomeMandapams.fulfilled, (state, action) => {
        state.loading = false
        state.allMandapams = action.payload.allMandapams
        state.featuredMandapams = action.payload.featuredMandapams
      })
      .addCase(loadHomeMandapams.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(loadMandapamById.pending, state => {
        state.loadingSingle = true
        state.singleError = null
      })
      .addCase(loadMandapamById.fulfilled, (state, action) => {
        state.loadingSingle = false
        state.singleMandapam = action.payload ?? null
        state.singleError = action.payload ? null : 'Mandapam not found'
      })
      .addCase(loadMandapamById.rejected, (state, action) => {
        state.loadingSingle = false
        state.singleError = action.payload as string
      })
  }
})

export const { clearSingleMandapam, setSingleMandapam } = mandapamsSlice.actions
export default mandapamsSlice.reducer
