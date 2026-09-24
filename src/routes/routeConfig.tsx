import type { ComponentType } from 'react'
import { Navigate, type RouteObject } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import { USER_MANAGEMENT_ROLES } from '@/config/navigation'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import type { RouteHandle } from '@/types/router'
import { NotFoundPage } from './NotFoundPage'
import { ROUTES } from './paths'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { RouteErrorBoundary } from './RouteErrorBoundary'

/** Code-splits a page. Page modules default-export their component. */
function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default })
}

export const routeConfig: RouteObject[] = [
  {
    path: ROUTES.root,
    ErrorBoundary: RouteErrorBoundary,
    hydrateFallbackElement: <LoadingState />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: ROUTES.login, lazy: lazyPage(() => import('@/features/auth/pages/LoginPage')) },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                // Keeps the sidebar and header on screen when a page fails.
                ErrorBoundary: RouteErrorBoundary,
                children: [
                  { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
                  {
                    path: ROUTES.dashboard,
                    handle: { breadcrumb: 'Dashboard' } satisfies RouteHandle,
                    lazy: lazyPage(() => import('@/features/dashboard/pages/DashboardPage')),
                  },
                  {
                    path: ROUTES.users,
                    handle: { breadcrumb: 'Users' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={USER_MANAGEMENT_ROLES} />,
                    children: [{ index: true, lazy: lazyPage(() => import('@/features/users/pages/UsersPage')) }],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
