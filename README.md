# Hot Kitchen Frontend

Admin web app for the Hot Kitchen API (the Laravel project in `../hot_kitchen_backend`).

**Stack:** React 19, TypeScript (strict), Vite, Tailwind CSS v4, shadcn/ui (Radix), Redux Toolkit and RTK Query, React Router 7, React Hook Form with Yup.

## Getting started

Requirements: Node.js 20.19+ (or 22.12+) and the backend API running.

```bash
npm install
cp .env.example .env.local   # then point VITE_API_URL at your API
npm run dev
```

| Script            | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the dev server with HMR               |
| `npm run build`   | Type-check (`tsc -b`) and build to `dist/`  |
| `npm run preview` | Serve the production build locally          |
| `npm run lint`    | Lint with oxlint                            |

### Environment variables

| Variable        | Required | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| `VITE_API_URL`  | yes      | API base URL including `/api`, e.g. `http://localhost:8000/api` |
| `VITE_APP_NAME` | no       | Name shown in the UI (default `Hot Kitchen`)           |

`VITE_*` values are bundled into the client, so never put secrets in them.

## Project structure

```text
src/
├── app/            store, typed hooks, providers, router, listener middleware
├── components/
│   ├── ui/         shadcn/ui primitives (generated, don't edit by hand)
│   ├── common/     generic building blocks: PageHeader, EmptyState, ErrorState, FormField, ...
│   ├── layout/     app shell: sidebar, header, breadcrumb
│   └── shared/     domain-aware pieces reused across features (UserAvatar)
├── config/         environment access, app settings, sidebar navigation
├── features/       one folder per business feature (auth, dashboard, ...)
├── hooks/          reusable hooks
├── layouts/        AuthLayout, MainLayout
├── lib/            small utilities (cn, constants, form helpers)
├── routes/         route config, path constants, guards, error pages
├── services/api/   the RTK Query API slice, base query, error handling
├── styles/         globals.css and theme.css (design tokens)
└── types/          shared API and router types
```

Conventions, the backend API contract, and a step-by-step guide to adding a feature are in [CLAUDE.md](CLAUDE.md).

### Theming

All colors, fonts and radii are defined in [src/styles/theme.css](src/styles/theme.css), with light values in `:root` and dark values in `.dark`. Components only use semantic utilities such as `bg-primary` and `text-muted-foreground`, so a rebrand or palette change only touches that file.

### Adding shadcn components

```bash
npx shadcn@latest add <component>
```
