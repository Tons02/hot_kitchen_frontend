import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge'
import { PRODUCT_STATUS_LABELS } from '../products.constants'
import type { ProductStatus } from '../products.types'

const STATUS_TONES: Record<ProductStatus, StatusTone> = {
  available: 'success',
  unavailable: 'warning',
  archived: 'neutral',
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <StatusBadge tone={STATUS_TONES[status]}>{PRODUCT_STATUS_LABELS[status]}</StatusBadge>
}
