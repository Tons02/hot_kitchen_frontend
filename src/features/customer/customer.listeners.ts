import { isAnyOf } from '@reduxjs/toolkit'
import { listenerMiddleware } from '@/app/listenerMiddleware'
import { saveSelectedStoreId } from './customer.utils'
import { storeCleared, storeSelected } from './customerSlice'

/** Side effects of customer state changes. Reducers stay pure; persistence happens here. */
export function registerCustomerListeners(): void {
  listenerMiddleware.startListening({
    matcher: isAnyOf(storeSelected, storeCleared),
    effect: (_action, { getState }) => {
      const state = getState() as { customer: { selectedStoreId: number | null } }
      saveSelectedStoreId(state.customer.selectedStoreId)
    },
  })
}
