import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { loadSelectedStoreId } from './customer.utils'

/**
 * Client state the customer site shares across pages. The chosen store decides which menu, featured
 * products and (later) cart the customer sees, so it lives here rather than in one page.
 */
interface CustomerState {
  selectedStoreId: number | null
}

const initialState: CustomerState = {
  // Restored so a returning customer keeps ordering from the same store.
  selectedStoreId: loadSelectedStoreId(),
}

export const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    storeSelected: (state, action: PayloadAction<number>) => {
      state.selectedStoreId = action.payload
    },
    storeCleared: (state) => {
      state.selectedStoreId = null
    },
  },
  selectors: {
    selectSelectedStoreId: (state) => state.selectedStoreId,
  },
})

export const { storeSelected, storeCleared } = customerSlice.actions
export const { selectSelectedStoreId } = customerSlice.selectors
