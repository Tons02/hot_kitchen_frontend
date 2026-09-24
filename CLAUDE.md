# Hot Kitchen Frontend

Admin frontend for the Laravel API in `../hot_kitchen_backend`. Follow the existing architecture. Don't introduce new patterns, libraries or folders when an existing one fits.

## Commands

- `npm run dev` · `npm run build` (runs `tsc -b` first) · `npm run lint` (oxlint). Build and lint must pass before a change is done.
- `npx shadcn@latest add <name>` for UI primitives (Radix base, nova style). Don't hand-edit `src/components/ui/*`. Compose on top of it in `components/common`.
- Stay on React Router 7, because v8 requires Node 22.22+ and this machine runs Node 20.
- Stay on TanStack Table v8. v9 is a new API (`useTable`, features); the `DataTable` component and shadcn's data-table guide use v8's `useReactTable`.

## Where things go

- `app/`: store (`combineSlices`), `useAppSelector` / `useAppDispatch` (never raw `useSelector`/`useDispatch`), providers, router, `listenerMiddleware`.
- `features/<name>/`: all feature code.
  - `<name>Api.ts`: `apiSlice.injectEndpoints(...)`
  - `<name>Slice.ts`: only for client state shared across components
  - `<name>.types.ts`, `<name>.schemas.ts` (Yup), `<name>.utils.ts`
  - `components/`
  - `pages/`: default-exported page components
- `components/`
  - `ui`: shadcn
  - `common`: generic building blocks
  - `layout`: app shell
  - `shared`: domain-aware pieces used by several features
- `routes/`: `routeConfig.tsx`, `paths.ts` (`ROUTES`), `ProtectedRoute` / `PublicRoute`, error pages.
- `config/`: `environment.ts` (the only place that reads `import.meta.env`), `app.ts`, `navigation.ts` (sidebar).
- `services/api/`: the single `createApi` (`apiSlice`), `baseQuery` (auth header, 401 handling), `apiError` (normalization), `apiErrorMiddleware` (global toasts).
- `styles/theme.css`: the only place colors, fonts and radii are defined.

## Adding a feature

`features/users` is the reference implementation: list with filters, create/edit pages, row actions with confirm dialogs.

1. `<name>.types.ts`: mirror the Laravel Resource. `<name>.constants.ts` holds labels and option lists.
2. `<name>Api.ts`: `injectEndpoints` using the tag types in `apiSlice.ts` (add any new ones there), plus `providesTags` / `invalidatesTags`. Unwrap `ApiResponse<T>` in `transformResponse`.
3. Pages in `pages/`, starting with `<PageHeader>`. Keep them thin and orchestrate small components (table, filters, form, action dialogs).
4. Add the path to `ROUTES` (builders like `ROUTES.userEdit(id)` for params). Register the route in `routeConfig.tsx` inside the MainLayout error-boundary group, with `handle: { breadcrumb }` and `lazy: lazyPage(...)`.
5. Add a sidebar item in `config/navigation.ts`. For role-restricted pages, export the allowed roles from there and use them for both the item's `roles` and the route's `<ProtectedRoute allowedRoles>`. These checks only shape the UI; the API enforces access.

## Conventions

- **Colors:** use semantic utilities only (`bg-primary`, `text-muted-foreground`, `text-destructive`, `bg-success`, `text-warning`, ...). No hex, rgb or arbitrary color values. New tokens go in `theme.css` under both `:root` and `.dark`.
- **API-driven views** handle all four states:
  - loading: tables show `<DataTable isLoading loadingLabel="Loading users…">` (the `tableLoading` animation); whole pages use `<LoadingState>`
  - empty: tables use `<DataTableEmptyState title description action>` (the `noDataTable` animation); elsewhere `<EmptyState>`
  - error: `<ErrorState error={error} onRetry={refetch} />`
  - success
- **Buttons that wait on the server** (submit, confirm) are `<LoadingButton isLoading={isSubmitting}>`, which shows the `buttonLoading` animation in the button's text color and disables it. Never hand-roll a spinner in a button.
- **Animations:** `<LottieAnimation animationData={json} />` plays Lottie JSON from `src/assets/` with lottie-web's light SVG player (no expressions). It respects reduced motion. Files that need expressions won't play in it.
- **Tables:** `<DataTable columns data isLoading emptyState />` (sorting + pagination). Filter the data before passing it in, and pass a stable array (a module-level empty constant, never `data ?? []` inline) or the table resets itself in a loop. Hide low-priority columns on small screens with `meta: { className: 'hidden md:table-cell' }`. Sortable headers use `<DataTableColumnHeader>`.
- **Forms:**
  - Set up with `useForm` + `yupResolver(schema)`. Long forms are split into `<FormSection>` cards.
  - Render fields with `<FormField control name label render={(field) => <Input {...field} />} />`. Add `optional` for optional fields.
  - Selects use `<SelectInput {...field} options />` (value `''` = nothing chosen; filters use `'all'`). Files use `<FileInput {...field} accept />` with a `File | null` value.
  - Keep form values as strings and convert to the typed API payload in `<name>.utils.ts` (see `toUserPayload`).
  - Submit with `await mutation(values).unwrap()` inside try/catch, and call `applyServerErrors(error, form.setError)` in the catch. The submit button is `<LoadingButton type="submit" isLoading={isSubmitting}>`.
  - Show `<FormErrorAlert message={errors.root?.server?.message} />` for form-level errors.
- **Destructive actions** (archive, deactivate, delete) go through `<ConfirmDialog>`. Without a form to show errors, catch with `toastInlineApiError(error)`.
- **Status:** `<StatusBadge tone>` (colored dot, foreground text) for record states.
- **Navigation:** link and navigate with `ROUTES.*`, never string literals. Set page titles through `<PageHeader>` or `<DocumentTitle>`.
- **State:** component UI state (dialog open, toggles) stays local. Redux holds only cross-cutting client state. Server data lives only in RTK Query; never copy it into a slice.
- **Types:** no `any`, and type every request, response and prop.

## Backend API contract

- **Auth:** `POST /login` with `{ username, password }` returns `{ token, data: user }`. Requests send the token as `Authorization: Bearer`. There is no `/me` endpoint, so the login user is persisted next to the token (`auth.utils.ts`).
- **Success envelope:** `{ status, message, data }` (`ApiResponse<T>` in `types/api.ts`).
- **Errors come in two shapes:**
  - toolkit helpers: `{ errors: [{ status, title, detail }] }`, where the message is in `detail` and `title` is often `''`
  - Laravel FormRequest validation (422): `{ message, errors: { field: [msg] } }`
  - "Invalid ID" is a 422, not a 404.
- **Error handling is centralized.** Don't re-implement it per page:
  - 401: `sessionExpired` signs the user out and shows a toast
  - failed mutations with network errors, 403, 404, 413, 429 or 5xx: global toast
  - 400, 409 and 422: shown inline by the form
  - never render raw `error.data`
- **Index endpoints** use `dynamicPaginate()` (`page`, `per_page` up to 100, `pagination=none` for all rows). With `pagination=none` they return every row formatted by the Resource; the paginated variants return either formatted rows or page totals, never both. So lists load with `pagination=none` and search, filter and page on the client. Filters (`allowedFilters`) and `status=inactive` (soft-deleted rows) are query params.
- **Signed file URLs** (`profile_picture_url`, `proof_of_license_url`) expire after about 5 minutes, so queries that show them use `refetchOnMountOrArgChange: true`. Always render them with a fallback.
- **Users** belong to a store (`store_id`) unless they're admins; the API rejects a store for admins and requires one for everyone else.
- **File uploads:** PHP doesn't parse multipart bodies on PATCH/PUT. To upload files to a PATCH route, send `POST` with a `_method=PATCH` form field.
