import type { SelectOption } from '@/components/common/SelectInput'
import type { StatusTone } from '@/components/common/StatusBadge'
import type { DiscountType, VoucherStatus, VoucherStatusFilter } from './storeVouchers.types'

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  used_up: 'Used up',
  disabled: 'Disabled',
  archived: 'Archived',
}

export const VOUCHER_STATUS_TONES: Record<VoucherStatus, StatusTone> = {
  active: 'success',
  scheduled: 'neutral',
  expired: 'destructive',
  used_up: 'warning',
  disabled: 'neutral',
  archived: 'neutral',
}

/** The status tabs, in the order a manager thinks about them. */
export const VOUCHER_STATUS_TABS: { value: VoucherStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
  { value: 'used_up', label: 'Used up' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'archived', label: 'Archived' },
]

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage off',
  fixed_amount: 'Fixed amount off',
  free_delivery: 'Free delivery',
}

export const DISCOUNT_TYPE_OPTIONS: SelectOption[] = Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** StoreVoucherRequest's limits. */
export const MAX_AMOUNT = 999_999.99
export const MAX_CODE_LENGTH = 50

export const DEFAULT_VOUCHERS_PAGE_SIZE = 10

/** Keyboard shortcuts on the Store Vouchers page, matching the other lists. Also shown in the UI as hints. */
export const VOUCHER_SHORTCUTS = {
  addVoucher: 'Alt+A',
  search: 'Alt+S',
} as const
