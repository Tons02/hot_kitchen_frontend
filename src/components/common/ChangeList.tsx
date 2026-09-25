import { ArrowRightIcon } from 'lucide-react'

export interface ChangeListItem {
  label: string
  from: string
  to: string
}

/** What a save will change, one setting per row: label, then old value → new value. For confirmations. */
export function ChangeList({ changes }: { changes: ChangeListItem[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {changes.map((change) => (
        <li key={change.label} className="grid gap-0.5">
          <span className="text-muted-foreground">{change.label}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="line-through decoration-muted-foreground/60">{change.from}</span>
            <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-label="changes to" />
            <span className="font-medium">{change.to}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
