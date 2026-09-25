import type { ComponentType } from 'react'
import { Navigate, type RouteObject } from 'react-router'
import { LoadingState } from '@/components/common/LoadingState'
import {
  PRODUCT_MANAGEMENT_ROLES,
  STORE_INVENTORY_ROLES,
  STORE_MANAGEMENT_ROLES,
  STORE_VOUCHER_ROLES,
  USER_MANAGEMENT_ROLES,
} from '@/config/navigation'
import { StoreBreadcrumb } from '@/features/stores/components/StoreBreadcrumb'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { MainLayout } from '@/layouts/MainLayout'
import type { RouteHandle } from '@/types/router'
import { NotFoundPage } from './NotFoundPage'
import { ROUTES } from './paths'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { RouteErrorBoundary } from './RouteErrorBoundary'
import { StaffRoute } from './StaffRoute'

/** Code-splits a page. Page modules default-export their component. */
function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default })
}

export const routeConfig: RouteObject[] = [
  {
    path: ROUTES.home,
    ErrorBoundary: RouteErrorBoundary,
    hydrateFallbackElement: <LoadingState />,
    children: [
      {
        // The customer-facing site. Browsing is public; Orders and Account need a signed-in customer.
        element: <CustomerLayout />,
        children: [
          {
            // Keeps the header and bottom navigation on screen when a page fails.
            ErrorBoundary: RouteErrorBoundary,
            children: [
              { index: true, lazy: lazyPage(() => import('@/features/customer/pages/CustomerHomePage')) },
              { path: ROUTES.shopStores, lazy: lazyPage(() => import('@/features/customer/pages/CustomerStoresPage')) },
              {
                path: `${ROUTES.shopStores}/:storeId`,
                lazy: lazyPage(() => import('@/features/customer/pages/CustomerStorePage')),
              },
              {
                // Customer sign-up, in the shop's shell. Signed-in users are sent on by role.
                element: <PublicRoute />,
                children: [{ path: ROUTES.register, lazy: lazyPage(() => import('@/features/auth/pages/RegisterPage')) }],
              },
              {
                element: <ProtectedRoute />,
                children: [
                  { path: ROUTES.shopOrders, lazy: lazyPage(() => import('@/features/customer/pages/CustomerOrdersPage')) },
                  { path: ROUTES.shopAccount, lazy: lazyPage(() => import('@/features/customer/pages/CustomerAccountPage')) },
                ],
              },
            ],
          },
        ],
      },
      {
        // One sign-in for customers and staff; signed-in users are sent on by role.
        element: <PublicRoute />,
        children: [{ path: ROUTES.login, lazy: lazyPage(() => import('@/features/auth/pages/LoginPage')) }],
      },
      {
        // The staff admin. Customers who land here are sent to the shop's home.
        path: ROUTES.admin,
        element: <StaffRoute />,
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
                  {
                    path: ROUTES.stores,
                    handle: { breadcrumb: 'Stores' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={STORE_MANAGEMENT_ROLES} />,
                    children: [{ index: true, lazy: lazyPage(() => import('@/features/stores/pages/StoresPage')) }],
                  },
                  {
                    path: ROUTES.storeOperatingHours,
                    handle: { breadcrumb: 'Store Operating Hours' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={STORE_MANAGEMENT_ROLES} />,
                    children: [
                      { index: true, lazy: lazyPage(() => import('@/features/stores/pages/StoreOperatingHoursPage')) },
                    ],
                  },
                  {
                    path: ROUTES.storeInventory,
                    handle: { breadcrumb: 'Store Inventory' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={STORE_INVENTORY_ROLES} />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/storeInventories/pages/StoreInventoryStoresPage')),
                      },
                      {
                        path: ':storeId',
                        handle: { breadcrumb: StoreBreadcrumb } satisfies RouteHandle,
                        lazy: lazyPage(() => import('@/features/storeInventories/pages/StoreInventoryPage')),
                      },
                    ],
                  },
                  {
                    path: ROUTES.storeVouchers,
                    handle: { breadcrumb: 'Store Vouchers' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={STORE_VOUCHER_ROLES} />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/storeVouchers/pages/StoreVouchersStoresPage')),
                      },
                      {
                        path: ':storeId',
                        handle: { breadcrumb: StoreBreadcrumb } satisfies RouteHandle,
                        lazy: lazyPage(() => import('@/features/storeVouchers/pages/StoreVouchersPage')),
                      },
                    ],
                  },
                  {
                    path: ROUTES.productCategories,
                    handle: { breadcrumb: 'Product Categories' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={PRODUCT_MANAGEMENT_ROLES} />,
                    children: [
                      {
                        index: true,
                        lazy: lazyPage(() => import('@/features/productCategories/pages/ProductCategoriesPage')),
                      },
                    ],
                  },
                  {
                    path: ROUTES.products,
                    handle: { breadcrumb: 'Products' } satisfies RouteHandle,
                    element: <ProtectedRoute allowedRoles={PRODUCT_MANAGEMENT_ROLES} />,
                    children: [{ index: true, lazy: lazyPage(() => import('@/features/products/pages/ProductsPage')) }],
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
