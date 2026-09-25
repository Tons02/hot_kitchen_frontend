import type { Params } from 'react-router'
import { useGetStoreQuery } from '../storesApi'

/** A breadcrumb label for routes with a `:storeId` param: the store's name once it loads. */
export function StoreBreadcrumb({ params }: { params: Params }) {
  const storeId = Number(params.storeId)
  const isStoreId = Number.isInteger(storeId) && storeId > 0
  const { data: store } = useGetStoreQuery(storeId, { skip: !isStoreId })
  return <>{store?.name ?? 'Store'}</>
}
