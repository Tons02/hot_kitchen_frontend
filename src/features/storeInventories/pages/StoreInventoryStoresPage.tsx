import { Navigate } from 'react-router'
import { StoreDirectory } from '@/features/stores/components/StoreDirectory'
import { useOwnStoreId } from '@/features/stores/hooks/useOwnStoreId'
import { ROUTES } from '@/routes/paths'
import { INVENTORY_STORE_COLUMNS, renderInventoryStoreMeta } from '../components/inventoryStoreColumns'

/**
 * Step one of Store Inventory: find the store, with each store's stock counts. Opening one goes to its
 * inventory page. Store-bound users go straight to their own store.
 */
export default function StoreInventoryStoresPage() {
  const ownStoreId = useOwnStoreId()
  if (ownStoreId !== null) return <Navigate to={ROUTES.storeInventoryDetail(ownStoreId)} replace />

  return (
    <StoreDirectory
      title="Store inventory"
      description="Pick a store to manage its products, stock levels, reserved quantities and low-stock thresholds."
      getStoreHref={ROUTES.storeInventoryDetail}
      openLabel="Open inventory"
      extraColumns={INVENTORY_STORE_COLUMNS}
      renderCardMeta={renderInventoryStoreMeta}
      emptyDescription="Add a store in Store Management first, then stock it here."
    />
  )
}
