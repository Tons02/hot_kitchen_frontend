import { Navigate } from 'react-router'
import { StoreDirectory } from '@/features/stores/components/StoreDirectory'
import { useOwnStoreId } from '@/features/stores/hooks/useOwnStoreId'
import { ROUTES } from '@/routes/paths'

/**
 * Step one of Store Vouchers: find the store. Opening one goes to its vouchers. Store-bound users go
 * straight to their own store.
 */
export default function StoreVouchersStoresPage() {
  const ownStoreId = useOwnStoreId()
  if (ownStoreId !== null) return <Navigate to={ROUTES.storeVouchersDetail(ownStoreId)} replace />

  return (
    <StoreDirectory
      title="Store vouchers"
      description="Pick a store to create and manage its discount codes."
      getStoreHref={ROUTES.storeVouchersDetail}
      openLabel="Open vouchers"
      emptyDescription="Add a store in Store Management first, then create its vouchers here."
    />
  )
}
