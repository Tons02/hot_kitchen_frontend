import { isRouteErrorResponse, useRouteError } from 'react-router'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { ErrorState } from '@/components/common/ErrorState'
import { NotFoundPage } from './NotFoundPage'

/** Catches render errors and failed lazy-route loads (e.g. a stale chunk after a deploy). */
export function RouteErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  if (import.meta.env.DEV) console.error(error)

  return (
    <>
      <DocumentTitle title="Something went wrong" />
      <ErrorState
        description="An unexpected error occurred while loading this page."
        onRetry={() => window.location.reload()}
      />
    </>
  )
}
