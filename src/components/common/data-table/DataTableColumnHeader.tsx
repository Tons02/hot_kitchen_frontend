import type { Column } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
}

/** A column header that toggles sorting when the column allows it. */
export function DataTableColumnHeader<TData, TValue>({ column, title }: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) return title

  const sorted = column.getIsSorted()
  const SortIcon = sorted === 'asc' ? ArrowUpIcon : sorted === 'desc' ? ArrowDownIcon : ChevronsUpDownIcon

  return (
    <Button variant="ghost" size="sm" className="-ml-2.5" onClick={column.getToggleSortingHandler()}>
      {title}
      <SortIcon className={sorted ? undefined : 'text-muted-foreground'} aria-hidden="true" />
    </Button>
  )
}
