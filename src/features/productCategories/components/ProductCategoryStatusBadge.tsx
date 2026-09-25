import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge'
import { PRODUCT_CATEGORY_STATUS_LABELS } from '../productCategories.constants'
import type { ProductCategoryStatus } from '../productCategories.types'

const STATUS_TONES: Record<ProductCategoryStatus, StatusTone> = {
  active: 'success',
  archived: 'neutral',
}

export function ProductCategoryStatusBadge({ status }: { status: ProductCategoryStatus }) {
  return <StatusBadge tone={STATUS_TONES[status]}>{PRODUCT_CATEGORY_STATUS_LABELS[status]}</StatusBadge>
}
