import { createListenerMiddleware } from '@reduxjs/toolkit'

/** Shared listener middleware. Features register their side effects on it (see `registerAuthListeners`). */
export const listenerMiddleware = createListenerMiddleware()
