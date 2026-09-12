import { configureStore } from '@reduxjs/toolkit'
import mandapamsReducer from '../features/mandapams/mandapamsSlice'

export const store = configureStore({
  reducer: {
    mandapams: mandapamsReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
