import { FilterXIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useState, type Ref } from 'react'
import { SearchInput } from '@/components/common/SearchInput'
import { SelectInput, type SelectOption } from '@/components/common/SelectInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useStoreOptions } from '@/features/stores/hooks/useStoreOptions'
import { DEFAULT_USER_FILTERS, ROLE_LABELS, STAFF_ROLES, USER_SHORTCUTS } from '../users.constants'
import type { UserFilterValues, UserListView } from '../users.types'
import { countActiveFilters } from '../users.utils'

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All roles' },
  ...STAFF_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'deactivated', label: 'Deactivated' },
]

/** The success-colored button style, from the global theme tokens. */
const APPLY_BUTTON_CLASS = 'bg-success text-success-foreground hover:bg-success/90'

interface UserToolbarProps {
  view: UserListView
  search: string
  onSearch: (search: string) => void
  filters: UserFilterValues
  onFiltersChange: (filters: UserFilterValues) => void
  /** Lets the page focus the search box from its keyboard shortcut. */
  searchRef?: Ref<HTMLInputElement>
}

/** Search (on Enter) and a filter popover whose choices only apply when you press Apply. */
export function UserToolbar({ view, search, onSearch, filters, onFiltersChange, searchRef }: UserToolbarProps) {
  const { options: storeOptions } = useStoreOptions()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const activeCount = countActiveFilters(filters, view)

  const handleOpenChange = (open: boolean) => {
    // Every time the popover opens it starts from the filters that are actually applied.
    if (open) setDraft(filters)
    setIsOpen(open)
  }

  const apply = (next: UserFilterValues) => {
    onFiltersChange(next)
    setIsOpen(false)
  }

  const setDraftField = (patch: Partial<UserFilterValues>) => setDraft((current) => ({ ...current, ...patch }))

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchInput
        value={search}
        onSearch={onSearch}
        placeholder="Search name, username, email or mobile, then press Enter"
        label="Search users"
        shortcut={USER_SHORTCUTS.search}
        ref={searchRef}
        className="sm:max-w-md"
      />
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <SlidersHorizontalIcon />
              Filters
              {activeCount > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                apply(draft)
              }}
            >
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="user-filter-role">Role</FieldLabel>
                  <SelectInput
                    id="user-filter-role"
                    value={draft.role}
                    onChange={(role) => setDraftField({ role })}
                    options={ROLE_OPTIONS}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="user-filter-store">Store</FieldLabel>
                  <SelectInput
                    id="user-filter-store"
                    value={draft.storeId}
                    onChange={(storeId) => setDraftField({ storeId })}
                    options={[{ value: 'all', label: 'All stores' }, ...storeOptions]}
                  />
                </Field>
                {view === 'current' && (
                  <Field>
                    <FieldLabel htmlFor="user-filter-status">Status</FieldLabel>
                    <SelectInput
                      id="user-filter-status"
                      value={draft.status}
                      onChange={(status) => setDraftField({ status })}
                      options={STATUS_OPTIONS}
                    />
                  </Field>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="destructive" onClick={() => apply(DEFAULT_USER_FILTERS)}>
                    Clear
                  </Button>
                  <Button type="submit" className={APPLY_BUTTON_CLASS}>
                    Apply filters
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </PopoverContent>
        </Popover>
        {activeCount > 0 && (
          <Button variant="destructive" onClick={() => onFiltersChange(DEFAULT_USER_FILTERS)}>
            <FilterXIcon />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
