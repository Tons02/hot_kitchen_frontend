import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTES } from './paths'

export function NotFoundPage() {
  return (
    <>
      <DocumentTitle title="Page not found" />
      <EmptyState
        icon={CompassIcon}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <Button asChild>
            <Link to={ROUTES.home}>Back to home</Link>
          </Button>
        }
      />
    </>
  )
}
