import { Link } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { AppLogoMark } from '@/components/common/AppLogo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { appConfig } from '@/config/app'
import { navigation } from '@/config/navigation'
import { hasRole } from '@/features/auth/auth.utils'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { ROUTES } from '@/routes/paths'
import { NavMain } from './NavMain'
import { NavUser } from './NavUser'

export function AppSidebar() {
  const user = useAppSelector(selectCurrentUser)

  const groups = navigation
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.roles || hasRole(user, item.roles)) }))
    .filter((group) => group.items.length > 0)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to={ROUTES.root}>
                <AppLogoMark />
                <span className="truncate font-heading font-semibold">{appConfig.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
