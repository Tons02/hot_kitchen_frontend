import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'
import { SelectInput } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'

const PAGE_SIZE_OPTIONS = [10, 20, 50].map((size) => ({ value: String(size), label: String(size) }))

export interface DataTablePaginationProps {
  /** 1-based. */
  page: number
  pageCount: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

export function DataTablePagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: DataTablePaginationProps) {
  const lastPage = Math.max(pageCount, 1)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const canGoBack = !disabled && page > 1
  const canGoForward = !disabled && page < lastPage

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 text-sm sm:flex-row">
      <p className="text-muted-foreground tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows per page</span>
          <SelectInput
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={PAGE_SIZE_OPTIONS}
            disabled={disabled}
            aria-label="Rows per page"
            className="w-18"
          />
        </div>
        <span className="tabular-nums">
          Page {page} of {lastPage}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" aria-label="First page" disabled={!canGoBack} onClick={() => onPageChange(1)}>
            <ChevronsLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={!canGoBack} onClick={() => onPageChange(page - 1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={!canGoForward} onClick={() => onPageChange(page + 1)}>
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Last page" disabled={!canGoForward} onClick={() => onPageChange(lastPage)}>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
