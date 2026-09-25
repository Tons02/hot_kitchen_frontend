import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id?: string
  title: string
  description?: ReactNode
  /** e.g. "View full menu". Sits beside the title on wide screens, below it on phones. */
  action?: ReactNode
}

/** The title row of a customer-page section. */
export function SectionHeading({ id, title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 id={id} className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
