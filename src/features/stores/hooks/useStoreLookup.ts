import { useMemo } from 'react'
import type { Store } from '../stores.types'
import { useGetStoresQuery } from '../storesApi'

/** Every store by id, for showing a store's name where a record only carries its `store_id`. */
export function useStoreLookup() {
  const { data: stores, isLoading } = useGetStoresQuery()
  const byId = useMemo(() => new Map<number, Store>((stores ?? []).map((store) => [store.id, store])), [stores])
  return { byId, isLoading }
}
