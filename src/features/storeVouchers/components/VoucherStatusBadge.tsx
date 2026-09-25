import { StatusBadge } from '@/components/common/StatusBadge'
import { VOUCHER_STATUS_LABELS, VOUCHER_STATUS_TONES } from '../storeVouchers.constants'
import type { VoucherStatus } from '../storeVouchers.types'

/** The API's lifecycle status in words, with a colored dot. */
export function VoucherStatusBadge({ status }: { status: VoucherStatus }) {
  return <StatusBadge tone={VOUCHER_STATUS_TONES[status]}>{VOUCHER_STATUS_LABELS[status]}</StatusBadge>
}
