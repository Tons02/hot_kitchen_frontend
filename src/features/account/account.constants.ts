import type { SelectOption } from '@/components/common/SelectInput'
import type { AddressLabel } from './account.types'

export const ADDRESS_LABELS: Record<AddressLabel, string> = {
  home: 'Home',
  office: 'Office',
  work: 'Work',
  other: 'Other',
}

export const ADDRESS_LABEL_OPTIONS: SelectOption[] = Object.entries(ADDRESS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** The API's limit (UserController::MAX_ADDRESSES). */
export const MAX_ADDRESSES = 10
