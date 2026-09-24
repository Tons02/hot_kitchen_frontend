import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge'
import { STORE_STATUS_LABELS } from '../stores.constants'
import type { StoreStatus } from '../stores.types'

const STATUS_TONES: Record<StoreStatus, StatusTone> = {
  active: 'success',
  inactive: 'warning',
  archived: 'neutral',
}

export function StoreStatusBadge({ status }: { status: StoreStatus }) {
  return <StatusBadge tone={STATUS_TONES[status]}>{STORE_STATUS_LABELS[status]}</StatusBadge>
}
