import { useGetStoreQuery } from '../storesApi'

/**
 * One store's display name, e.g. "Hot Kitchen Manila (MNL-01)", loaded by id (and cached) rather than
 * from the whole store list. Undefined while it loads or when `storeId` isn't a store's id.
 */
export function useStoreName(storeId: string | number): string | undefined {
  const id = Number(storeId)
  const isStoreId = Number.isInteger(id) && id > 0
  const { data: store } = useGetStoreQuery(id, { skip: !isStoreId })
  return store ? `${store.name} (${store.code})` : undefined
}
