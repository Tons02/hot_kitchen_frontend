import type { ColumnDef } from '@tanstack/react-table'
import { formatPeso } from '@/lib/money'
import type { Voucher, VoucherAction } from '../storeVouchers.types'
import { formatDiscount, formatUsage, formatValidity } from '../storeVouchers.utils'
import { VoucherRowActions } from './VoucherRowActions'
import { VoucherStatusBadge } from './VoucherStatusBadge'

interface VoucherColumnsOptions {
  onAction: (action: VoucherAction) => void
}

/**
 * Columns for the vouchers table. Phones keep the voucher, its discount, status and actions; usage and
 * validity appear as the screen widens, and the details panel shows everything.
 */
export function getVoucherColumns({ onAction }: VoucherColumnsOptions): ColumnDef<Voucher>[] {
  return [
    {
      id: 'voucher',
      header: 'Voucher',
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <div className="grid min-w-40 justify-items-start gap-1 leading-tight">
            <button
              type="button"
              className="rounded-md border border-dashed bg-muted px-2 py-0.5 font-mono text-xs font-semibold tracking-wide hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              onClick={() => onAction({ type: 'view', voucher })}
              aria-label={`View voucher ${voucher.code}`}
            >
              {voucher.code}
            </button>
            <span className="max-w-full truncate text-sm">{voucher.name}</span>
          </div>
        )
      },
    },
    {
      id: 'discount',
      header: 'Discount',
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <div className="grid leading-tight">
            <span className="font-medium">{formatDiscount(voucher)}</span>
            <span className="text-xs text-muted-foreground">
              {voucher.min_order_amount ? `Min. order ${formatPeso(voucher.min_order_amount)}` : 'No minimum'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'usage',
      header: 'Usage',
      cell: ({ row }) => {
        const voucher = row.original
        return (
          <div className="grid leading-tight">
            <span className="tabular-nums">{formatUsage(voucher)}</span>
            <span className="text-xs text-muted-foreground">
              {voucher.per_user_limit ? `${voucher.per_user_limit} per customer` : 'No per-customer limit'}
            </span>
          </div>
        )
      },
      meta: { className: 'hidden md:table-cell' },
    },
    {
      id: 'validity',
      header: 'Valid',
      cell: ({ row }) => <span className="text-sm">{formatValidity(row.original)}</span>,
      meta: { className: 'hidden xl:table-cell' },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <VoucherStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <VoucherRowActions voucher={row.original} onAction={onAction} />
        </div>
      ),
      meta: { className: 'w-12' },
    },
  ]
}
