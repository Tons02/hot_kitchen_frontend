import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { registerAuthListeners } from '@/features/auth/auth.listeners'
import { authSlice } from '@/features/auth/authSlice'
import { registerCustomerListeners } from '@/features/customer/customer.listeners'
import { customerSlice } from '@/features/customer/customerSlice'
import { apiErrorMiddleware } from '@/services/api/apiErrorMiddleware'
import { apiSlice } from '@/services/api/apiSlice'
import { listenerMiddleware } from './listenerMiddleware'

const rootReducer = combineSlices(apiSlice, authSlice, customerSlice)

registerAuthListeners()
registerCustomerListeners()

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(apiSlice.middleware, apiErrorMiddleware),
})

// Powers `refetchOnFocus` / `refetchOnReconnect` (on for every query in apiSlice).
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
