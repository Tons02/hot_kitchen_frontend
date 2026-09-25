import { ShieldAlertIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTES } from './paths'

export function ForbiddenPage() {
  return (
    <>
      <DocumentTitle title="Access denied" />
      <EmptyState
        icon={ShieldAlertIcon}
        title="Access denied"
        description="You don't have permission to view this page. Contact an administrator if you think this is a mistake."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.dashboard}>Back to dashboard</Link>
          </Button>
        }
      />
    </>
  )
}
