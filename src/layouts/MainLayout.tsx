import { Outlet } from 'react-router'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/*
        Exactly one screen tall: the header stays put and the page scrolls below it.
        A page can give a child `flex-1 min-h-0` to fill the height that's left (see the users table).
      */}
      <SidebarInset className="h-svh overflow-hidden">
        <AppHeader />
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
