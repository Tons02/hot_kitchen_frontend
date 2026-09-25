import type { ComponentType } from 'react'
import type { Params } from 'react-router'

/** Data attached to a route's `handle` and read with `useMatches()`. */
export interface RouteHandle {
  /**
   * Label shown for this route in the header breadcrumb. A component when the label depends on the
   * route's params, e.g. a store's name for `/store-inventory/:storeId`.
   */
  breadcrumb?: string | ComponentType<{ params: Params }>
}
