import { CircleAlertIcon, CircleCheckIcon, CircleXIcon, PackageIcon, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { InventoryStatusFilter, InventorySummary } from '../storeInventories.types'

interface StoreInventoryStatsProps {
  /** Null while the inventory loads. */
  summary: InventorySummary | null
  /** The status filter that's applied, so its card shows as selected. */
  activeStatus: InventoryStatusFilter
  onStatusChange: (status: InventoryStatusFilter) => void
}

interface StatCard {
  status: InventoryStatusFilter
  label: string
  icon: LucideIcon
  iconClassName: string
  value: (summary: InventorySummary) => number
}

const CARDS: StatCard[] = [
  { status: 'all', label: 'Total products', icon: PackageIcon, iconClassName: 'text-muted-foreground', value: (s) => s.total },
  { status: 'in_stock', label: 'In stock', icon: CircleCheckIcon, iconClassName: 'text-success', value: (s) => s.in_stock },
  { status: 'low_stock', label: 'Low stock', icon: CircleAlertIcon, iconClassName: 'text-warning', value: (s) => s.low_stock },
  { status: 'out_of_stock', label: 'Out of stock', icon: CircleXIcon, iconClassName: 'text-destructive', value: (s) => s.out_of_stock },
]

/** Four compact counts. Clicking one filters the table to that status; "Total" clears it. */
export function StoreInventoryStats({ summary, activeStatus, onStatusChange }: StoreInventoryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        const isActive = activeStatus === card.status
        return (
          <button
            key={card.status}
            type="button"
            aria-pressed={isActive}
            disabled={!summary}
            onClick={() => onStatusChange(card.status)}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-card-foreground transition-colors',
              'hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none',
              isActive && 'border-primary ring-1 ring-primary',
            )}
          >
            <Icon className={cn('size-5 shrink-0', card.iconClassName)} aria-hidden="true" />
            <div className="grid min-w-0 leading-tight">
              <span className="truncate text-xs text-muted-foreground">{card.label}</span>
              {summary ? (
                <span className="font-heading text-xl font-semibold tabular-nums">{card.value(summary)}</span>
              ) : (
                <Skeleton className="mt-1 h-6 w-10" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
