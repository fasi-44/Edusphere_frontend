# CLAUDE.md - Edusphere Frontend

## Overview

Edusphere Frontend is a **React + TypeScript** web application for the multi-tenant School Management System. It replaces the older `school-management-frontend` (React + MUI + Redux) with a modern stack.

## Tech Stack

- **Framework:** React 19 + TypeScript 5.7
- **Build Tool:** Vite 6.1
- **Styling:** TailwindCSS 4.0 (via `@tailwindcss/postcss`)
- **State Management:** Zustand 5.0 (single store: `src/stores/authStore.ts`)
- **Routing:** React Router 7 (`react-router`) with `BrowserRouter`
- **HTTP Client:** Axios 1.13 with centralized client (`src/services/api/client.ts`)
- **Forms:** Zod 4 for validation
- **Charts:** ApexCharts 4.1
- **Calendar:** FullCalendar 6.1
- **PDF:** pdfmake 0.3
- **Drag & Drop:** react-dnd 16
- **Notifications:** react-hot-toast 2.6
- **SVG:** vite-plugin-svgr (named export as `ReactComponent`)

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev          # or: npx vite

# Build for production
npm run build        # runs: tsc -b && vite build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Project Structure

```
src/
  App.tsx              # All routes defined here (BrowserRouter + lazy loading)
  main.tsx             # Entry point
  stores/
    authStore.ts       # Zustand auth store (user, login, logout, academicYear)
  services/
    api/
      config.ts        # API_CONFIG (base URL, timeout) + API_ENDPOINTS
      client.ts        # Axios instance with auth interceptors + token refresh
    auth/
      authService.ts   # Login/logout/token management
    modules/           # Domain services (examService, classService, etc.)
    dashboard/         # Dashboard data services
  pages/
    AuthPages/         # SignIn, SignUp
    Dashboard/         # Role-based dashboards (SuperAdmin, Administrator, Educator, Learner, Guardian)
    SchoolManagement/  # School CRUD (SuperAdmin)
    UserManagement/    # Users, Teachers, Students, Parents, Roles
    ClassManagement/   # Classes, Sections
    AttendanceManagement/
    AnnouncementManagement/
    TimetableManagement/
    ExamManagement/    # Exam types, subject configs
    AcademicsManagement/ # Subjects, marks entry, progress cards
    FinanceManagement/ # Fee structures, collection, expenses, salaries
    SyllabusManagement/
    AssignmentManagement/
  layout/
    AppLayout.tsx      # Main authenticated layout with sidebar
    AppSidebar.tsx     # Sidebar navigation (role-filtered via permissions)
  components/
    auth/
      ProtectedRoute.tsx    # Requires authentication
      PermissionGuard.tsx   # Requires specific permissions
  config/
    permissions.ts     # Permission enum, ROUTE_PERMISSION_MAP, SIDEBAR_PERMISSION_MAP
  hooks/               # Custom hooks (useAuth, usePermissions, etc.)
  context/             # React contexts (SidebarContext, etc.)
  types/               # TypeScript type definitions
  icons/               # SVG icon components
  prints/              # PDF generation templates
  data/                # Static data (searchablePages, etc.)
  utils/               # Utility functions
```

## Key Architecture Patterns

### Path Aliases
- `@/` maps to `src/` (configured in `vite.config.ts` resolve alias)
- Example: `import { useAuth } from '@/hooks/useAuth'`

### Authentication Flow
1. Login via `authService.login()` -> stores tokens in `localStorage`
2. Axios request interceptor attaches `Bearer` token from `localStorage`
3. On 401: automatic token refresh via `/auth/refresh` endpoint
4. If refresh fails: force logout (clear localStorage, redirect to `/`)
5. Auth state managed by Zustand store (`useAuthStore`)

### Permission System
- `Permission` enum in `src/config/permissions.ts` defines all granular permissions
- `ROUTE_PERMISSION_MAP`: maps route paths to required permissions
- `SIDEBAR_PERMISSION_MAP`: controls sidebar item visibility per role
- `PermissionGuard` component wraps routes requiring specific permissions
- `usePermissions` hook for checking permissions in components

### Route Protection
- All app routes wrapped in `<ProtectedRoute>` (checks `isAuthenticated`)
- Individual routes wrapped with `guarded()` helper for permission checks
- All page components are lazy-loaded with `React.lazy()` + `Suspense`

### API Layer
- **Response interceptor returns `response.data` directly** - services receive the data object, not AxiosResponse
- All endpoints defined in `API_ENDPOINTS` constant (`src/services/api/config.ts`)
- School ID (`skid`) retrieved from `localStorage` logged user for multi-tenant calls
- Base URL configured via `VITE_API_BASE_URL` env var (default: `http://localhost:5000/api`)

### Sidebar Navigation
- Defined in `src/layout/AppSidebar.tsx` as `allMenuItems` array
- Each item has `name`, `icon`, optional `path` or `subItems`
- Filtered at runtime based on user permissions via `SIDEBAR_PERMISSION_MAP`

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Important Notes

- This is a **separate project** from the older `school-management-frontend` - do not confuse them
- Uses TailwindCSS v4 (not v3) - different config approach via `@tailwindcss/postcss`
- No Redux - uses Zustand for state management
- No Material-UI - uses TailwindCSS for all styling
- Token refresh logic queues failed requests and retries them after refresh succeeds
- Academic year context is stored in the auth store and used to scope data queries
