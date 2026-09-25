import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGetStoreQuery } from '@/features/stores/storesApi'
import { selectSelectedStoreId, storeCleared, storeSelected } from '../customerSlice'

/**
 * The store the customer is ordering from, shared by every customer page. Loads its details (public,
 * no sign-in needed) and forgets a remembered store that no longer exists.
 */
export function useSelectedStore() {
  const dispatch = useAppDispatch()
  const storeId = useAppSelector(selectSelectedStoreId)
  const { data: store, isLoading, isError } = useGetStoreQuery(storeId ?? 0, { skip: !storeId })

  useEffect(() => {
    if (isError) dispatch(storeCleared())
  }, [isError, dispatch])

  // Stable, so pages can select a store from an effect.
  const select = useCallback((id: number) => dispatch(storeSelected(id)), [dispatch])
  const clear = useCallback(() => dispatch(storeCleared()), [dispatch])

  return { storeId, store, isLoading, select, clear }
}
