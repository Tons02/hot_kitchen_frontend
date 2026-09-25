import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/date'
import { formatPeso } from '@/lib/money'
import type { Voucher } from '../storeVouchers.types'
import { formatDiscount, formatScope, formatUsage, getVoucherFormDefaults } from '../storeVouchers.utils'
import { useGetStoreVoucherQuery, useGetVoucherUsagesQuery } from '../storeVouchersApi'
import { VoucherStatusBadge } from './VoucherStatusBadge'

const USAGES_PAGE_SIZE = 10

interface VoucherDetailsSheetProps {
  storeId: number
  /** The row that was clicked. Kept after closing so the content doesn't blank out during the exit animation. */
  voucher: Voucher | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Offered for vouchers that aren't archived. */
  onEdit: (voucher: Voucher) => void
}

/** Everything about one voucher: its settings, how much it has given away, and who used it. */
export function VoucherDetailsSheet({ storeId, voucher, open, onOpenChange, onEdit }: VoucherDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        {voucher && <VoucherDetailsContent key={voucher.id} storeId={storeId} row={voucher} onEdit={onEdit} />}
      </SheetContent>
    </Sheet>
  )
}

function VoucherDetailsContent({ storeId, row, onEdit }: { storeId: number; row: Voucher; onEdit: (voucher: Voucher) => void }) {
  // The row renders at once; the fresh copy adds the total discount given.
  const { data } = useGetStoreVoucherQuery({ storeId, voucherId: row.id }, { refetchOnMountOrArgChange: true })
  const voucher = data ?? row
  const scope = getVoucherFormDefaults(voucher)

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex flex-wrap items-center gap-2">
          <SheetTitle className="font-mono tracking-wide">{voucher.code}</SheetTitle>
          <VoucherStatusBadge status={voucher.status} />
        </div>
        <SheetDescription>{voucher.name}</SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        {voucher.description && <p className="text-sm text-muted-foreground">{voucher.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Times used">{voucher.used_count.toLocaleString()}</Stat>
          <Stat label="Discount given">
            {voucher.total_discount_given !== undefined ? (
              formatPeso(voucher.total_discount_given)
            ) : (
              <Skeleton className="mt-1 h-6 w-20" />
            )}
          </Stat>
        </div>

        <Section title="Discount">
          <Row label="Gives">{formatDiscount(voucher)}</Row>
          <Row label="Minimum order">{voucher.min_order_amount ? formatPeso(voucher.min_order_amount) : 'None'}</Row>
          <Row label="Applies to">{formatScope(scope.products, scope.categories)}</Row>
        </Section>

        <Separator />

        <Section title="Limits">
          <Row label="Usage">{formatUsage(voucher)}</Row>
          <Row label="Per customer">{voucher.per_user_limit?.toLocaleString() ?? 'Unlimited'}</Row>
          <Row label="Eligibility">{voucher.first_order_only ? 'First order only' : 'Any order'}</Row>
          <Row label="With other vouchers">{voucher.is_individual_use ? "Can't be combined" : 'Can be combined'}</Row>
        </Section>

        <Separator />

        <Section title="Schedule">
          <Row label="Starts">{voucher.starts_at ? formatDateTime(voucher.starts_at) : 'Right away'}</Row>
          <Row label="Ends">{voucher.expires_at ? formatDateTime(voucher.expires_at) : 'No end date'}</Row>
          <Row label="Created">{formatDateTime(voucher.created_at)}</Row>
        </Section>

        <Separator />

        <UsageHistory storeId={storeId} voucherId={voucher.id} />
      </div>

      {voucher.status !== 'archived' && (
        <SheetFooter className="border-t">
          <Button onClick={() => onEdit(voucher)}>
            <PencilIcon />
            Edit voucher
          </Button>
        </SheetFooter>
      )}
    </>
  )
}

/** Who redeemed the voucher, newest first, a page at a time. */
function UsageHistory({ storeId, voucherId }: { storeId: number; voucherId: number }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, error, refetch } = useGetVoucherUsagesQuery({
    storeId,
    voucherId,
    page,
    perPage: USAGES_PAGE_SIZE,
  })
  const usages = data?.items ?? []

  return (
    <section className="flex flex-col gap-3" aria-busy={isFetching}>
      <h3 className="font-heading text-sm font-medium">Usage history</h3>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Couldn't load the usage history" error={error} onRetry={refetch} className="rounded-xl border py-6" />
      ) : usages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody has used it yet.</p>
      ) : (
        <>
          <ul className="divide-y rounded-lg border text-sm">
            {usages.map((usage) => (
              <li key={usage.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="grid min-w-0 leading-tight">
                  <span className="truncate font-medium">{usage.user?.name ?? `Customer #${usage.user_id}`}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatDateTime(usage.used_at)}
                    {usage.order_id !== null && ` · Order #${usage.order_id}`}
                  </span>
                </div>
                <span className="shrink-0 font-medium tabular-nums">−{formatPeso(usage.discount_amount)}</span>
              </li>
            ))}
          </ul>
          {data && data.lastPage > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="tabular-nums">
                Page {data.page} of {data.lastPage}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous page"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next page"
                  disabled={page >= data.lastPage || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-heading text-lg font-semibold tabular-nums">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="font-heading text-sm font-medium">{title}</h3>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right break-words">{children}</dd>
    </div>
  )
}
