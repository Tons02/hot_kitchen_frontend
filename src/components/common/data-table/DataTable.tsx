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
import { DataTableEmptyState } from './DataTableEmptyState'
import { DataTableLoadingState } from './DataTableLoadingState'
import { DataTablePagination } from './DataTablePagination'

declare module '@tanstack/react-table' {
  // The type parameters are unused but must match TanStack's declaration to merge with it.
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Classes for the column's header and cells, e.g. `hidden md:table-cell` to hide it on small screens. */
    className?: string
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  /** Announced and shown under the loading animation, e.g. "Loading users…". */
  loadingLabel?: string
  /** Shown in place of the rows when `data` is empty. Use `<DataTableEmptyState>`. */
  emptyState?: ReactNode
  initialSorting?: SortingState
  pageSize?: number
  getRowId?: (row: TData) => string
}

/**
 * Client-side table with sorting and pagination. Filter the data before passing it in;
 * the table returns to the first page whenever the data changes.
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  loadingLabel = 'Loading…',
  emptyState,
  initialSorting = [],
  pageSize = 10,
  getRowId,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize })

  // TanStack Table v8 returns unmemoizable functions. That only matters with the React Compiler,
  // which this project doesn't use.
  // oxlint-disable-next-line react/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
          <TableBody>
            {isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0">
                  <DataTableLoadingState label={loadingLabel} />
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-0 whitespace-normal">
                  {emptyState ?? <DataTableEmptyState title="No results" />}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data.length > 0 && <DataTablePagination table={table} />}
    </div>
  )
}
