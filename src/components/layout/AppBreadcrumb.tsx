import { Fragment } from 'react'
import { Link, useMatches } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { RouteHandle } from '@/types/router'

/** Built from the `handle.breadcrumb` of every matched route. */
export function AppBreadcrumb() {
  const crumbs = useMatches().flatMap((match) => {
    const label = (match.handle as RouteHandle | undefined)?.breadcrumb
    return label ? [{ id: match.id, label, to: match.pathname }] : []
  })

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1

          return (
            <Fragment key={crumb.id}>
              <BreadcrumbItem className={isCurrent ? undefined : 'hidden md:inline-flex'}>
                {isCurrent ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.to}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isCurrent && <BreadcrumbSeparator className="hidden md:block" />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
