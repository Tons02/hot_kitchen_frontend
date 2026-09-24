import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table'
import { useState, type ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DataTableEmptyState } from './DataTableEmptyState'
import { DataTableLoadingState } from './DataTableLoadingState'
import { DataTablePagination, type DataTablePaginationProps } from './DataTablePagination'

declare module '@tanstack/react-table' {
  // The type parameters are unused but must match TanStack's declaration to merge with it.
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Classes for the column's header and cells, e.g. `hidden md:table-cell` to hide it on small screens. */
    className?: string
  }
}

/** Page controls for data the server pages (search, filters and paging happen on the API). */
export type ServerPagination = Omit<DataTablePaginationProps, 'disabled'>

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  /** The rows to show: the current page when `pagination` is set, otherwise every row. */
  data: TData[]
  /** First load: shows the loading animation in place of the rows. */
  isLoading?: boolean
  /** Loading another page or filter: keeps the rows visible, dimmed. */
  isFetching?: boolean
  /** Announced and shown under the loading animation, e.g. "Loading users…". */
  loadingLabel?: string
  /** Shown in place of the rows when `data` is empty. Use `<DataTableEmptyState>`. */
  emptyState?: ReactNode
  /** Server-side paging. Without it the table sorts and pages `data` itself. */
  pagination?: ServerPagination
  initialSorting?: SortingState
  getRowId?: (row: TData) => string
  /** Sizing for the card, e.g. `h-[80svh]`. With a height, the body scrolls under a sticky header. */
  className?: string
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  isFetching = false,
  loadingLabel = 'Loading…',
  emptyState,
  pagination,
  initialSorting = [],
  getRowId,
  className,
}: DataTableProps<TData>) {
  const isServerPaged = pagination !== undefined
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [clientPagination, setClientPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // TanStack Table v8 returns unmemoizable functions. That only matters with the React Compiler,
  // which this project doesn't use.
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, pagination: clientPagination },
    onSortingChange: setSorting,
    onPaginationChange: setClientPagination,
    getCoreRowModel: getCoreRowModel(),
    // Sorting one page of server results would be misleading, so server-paged tables don't sort.
    enableSorting: !isServerPaged,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: isServerPaged,
    getPaginationRowModel: isServerPaged ? undefined : getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows
  const hasRows = !isLoading && rows.length > 0

  const footer: DataTablePaginationProps = pagination ?? {
    page: clientPagination.pageIndex + 1,
    pageCount: table.getPageCount(),
    pageSize: clientPagination.pageSize,
    total: table.getPrePaginationRowModel().rows.length,
    onPageChange: (page) => table.setPageIndex(page - 1),
    onPageSizeChange: (pageSize) => table.setPageSize(pageSize),
  }

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card', className)}>
      {/*
        The shadcn table wraps itself in a scroll container. With rows, it takes the full height and scrolls
        under the sticky header. Loading and empty states sit below the header instead, centered in the space left.
      */}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          hasRows ? '*:data-[slot=table-container]:h-full' : '*:data-[slot=table-container]:shrink-0',
        )}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--color-border)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      className={header.column.columnDef.meta?.className}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            aria-busy={isFetching || undefined}
            className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}
          >
            {hasRows &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

          </TableBody>
        </Table>

        {!hasRows && (
          <div className="flex flex-1 items-center justify-center overflow-y-auto">
            {isLoading ? (
              <DataTableLoadingState label={loadingLabel} />
            ) : (
              (emptyState ?? <DataTableEmptyState title="No results" />)
            )}
          </div>
        )}
      </div>

      {!isLoading && footer.total > 0 && (
        <div className="border-t bg-muted/50 px-4 py-3">
          <DataTablePagination {...footer} disabled={isFetching} />
        </div>
      )}
    </div>
  )
}
