import type { ComponentProps } from 'react'
import noDataAnimation from '@/assets/noDataTable.json'
import { EmptyState } from '@/components/common/EmptyState'
import { LottieAnimation } from '@/components/common/LottieAnimation'

type DataTableEmptyStateProps = Omit<ComponentProps<typeof EmptyState>, 'icon' | 'iconClassName' | 'media'>

/** An empty table: the "no data" animation above a specific title, description and action. */
export function DataTableEmptyState(props: DataTableEmptyStateProps) {
  return <EmptyState {...props} media={<LottieAnimation animationData={noDataAnimation} className="size-44" />} />
}
