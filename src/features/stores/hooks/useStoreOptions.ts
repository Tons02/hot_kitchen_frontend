import { useMemo } from 'react'
import type { SelectOption } from '@/components/common/SelectInput'
import { useGetStoresQuery } from '../storesApi'

/** Stores as select options (value = store id), sorted by name. */
export function useStoreOptions() {
  const { data: stores, isLoading, isError, refetch } = useGetStoresQuery()

  const options = useMemo<SelectOption[]>(
    () =>
      [...(stores ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((store) => ({ value: String(store.id), label: `${store.name} (${store.code})` })),
    [stores],
  )

  return { options, isLoading, isError, refetch }
}
