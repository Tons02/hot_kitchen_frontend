import { matchPath, NavLink, useLocation } from 'react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { NavGroup } from '@/config/navigation'

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()

  return groups.map((group) => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) => (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={matchPath({ path: item.to, end: false }, pathname) !== null}
            >
              {/* Closes the off-canvas sidebar on mobile after navigating. */}
              <NavLink to={item.to} onClick={() => setOpenMobile(false)}>
                <item.icon />
                <span>{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  ))
}
