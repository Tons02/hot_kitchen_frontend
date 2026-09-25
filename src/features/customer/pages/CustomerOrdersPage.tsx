import { PackageIcon } from 'lucide-react'
import { Link } from 'react-router'
import { DocumentTitle } from '@/components/common/DocumentTitle'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/routes/paths'
import { SectionHeading } from '../components/SectionHeading'

/** Placeholder until ordering exists: the route and navigation are in place for order history. */
export default function CustomerOrdersPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <DocumentTitle title="Orders" />
      <SectionHeading title="Orders" description="Your current and past orders." />
      <EmptyState
        icon={PackageIcon}
        title="No orders yet"
        description="Online ordering is coming soon. Your orders will show up here."
        action={
          <Button asChild className="rounded-full">
            <Link to={ROUTES.shopStores}>Browse stores</Link>
          </Button>
        }
        className="rounded-2xl border border-dashed"
      />
    </div>
  )
}
