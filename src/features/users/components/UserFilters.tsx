import { FilterXIcon } from 'lucide-react'
import { SearchInput } from '@/components/common/SearchInput'
import { SelectInput, type SelectOption } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'
import { useStoreOptions } from '@/features/stores/hooks/useStoreOptions'
import { DEFAULT_USER_FILTERS, ROLE_LABELS, STAFF_ROLES } from '../users.constants'
import type { UserFilterValues, UserListView } from '../users.types'
import { hasActiveFilters } from '../users.utils'

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All roles' },
  ...STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
]

interface UserFiltersProps {
  value: UserFilterValues
  onChange: (value: UserFilterValues) => void
  view: UserListView
}

export function UserFilters({ value, onChange, view }: UserFiltersProps) {
  const { options: storeOptions } = useStoreOptions()
  const set = (patch: Partial<UserFilterValues>) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <SearchInput
        value={value.search}
        onChange={(search) => set({ search })}
        placeholder="Search by name, username, email or mobile"
        className="lg:max-w-sm"
      />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <SelectInput
          value={value.role}
          onChange={(role) => set({ role })}
          options={ROLE_OPTIONS}
          aria-label="Filter by role"
          className="sm:w-40"
        />
        <SelectInput
          value={value.storeId}
          onChange={(storeId) => set({ storeId })}
          options={[{ value: 'all', label: 'All stores' }, ...storeOptions]}
          aria-label="Filter by store"
          className="sm:w-48"
        />
        {view === 'current' && (
          <SelectInput
            value={value.status}
            onChange={(status) => set({ status })}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
            className="sm:w-36"
          />
        )}
        {hasActiveFilters(value) && (
          <Button variant="ghost" onClick={() => onChange(DEFAULT_USER_FILTERS)}>
            <FilterXIcon />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
