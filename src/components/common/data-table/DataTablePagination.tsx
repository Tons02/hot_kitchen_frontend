import type { Table } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { SelectInput } from '@/components/common/SelectInput'
import { Button } from '@/components/ui/button'

const PAGE_SIZE_OPTIONS = [10, 20, 50].map((size) => ({ value: String(size), label: String(size) }))

export function DataTablePagination<TData>({ table }: { table: Table<TData> }) {
  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getPrePaginationRowModel().rows.length
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

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
            onChange={(value) => table.setPageSize(Number(value))}
            options={PAGE_SIZE_OPTIONS}
            aria-label="Rows per page"
            className="w-18"
          />
        </div>
        <span className="tabular-nums">
          Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
