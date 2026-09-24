import { LayoutDashboardIcon } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { selectCurrentUser } from '@/features/auth/authSlice'

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={user ? `Welcome back, ${user.first_name}.` : undefined}
      />
      <EmptyState
        icon={LayoutDashboardIcon}
        title="Nothing to show yet"
        description="Store, product and staff summaries will appear here as those modules are added."
        className="border"
      />
    </>
  )
}
