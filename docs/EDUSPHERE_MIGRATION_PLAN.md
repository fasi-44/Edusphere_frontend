# EDUSPHERE MIGRATION PLAN

**Project:** Edusphere Frontend - Legacy to Modern Stack Migration
**Start Date:** 2026-01-02
**Status:** 🟡 Phase 1 (Auth) - In Progress
**Last Updated:** 2026-01-02 18:00 UTC

---

## EXECUTIVE SUMMARY

This document tracks the migration of the legacy school management frontend (Redux + MUI) to the modern **Edusphere** platform built with:
- **React 19** + **TypeScript**
- **TailAdmin** theme
- **Tailwind CSS**
- **Zustand** state management (NO Redux)
- **Feature-based architecture**
- **Generic education terminology** (not school-specific)

---

## USER ROLES

**Backend Role Names (Exact):**

| Role | API Value | Description |
|---|---|---|
| SuperAdmin | `SUPER_ADMIN` | Creates schools, manages entire system |
| School Admin | `SCHOOL_ADMIN` | Manages a specific school |
| Principal | `PRINCIPAL` | Principal/Leadership role in school |
| Teacher | `TEACHER` | Teaches classes, manages students |
| Student | `STUDENT` | Enrolled in courses, submits assignments |
| Parent | `PARENT` | Monitors child's progress |

**Dashboard Routing:**
- `SUPER_ADMIN` → SuperAdminDashboard (system-wide stats)
- `SCHOOL_ADMIN` → AdministratorDashboard (school management)
- `PRINCIPAL` → AdministratorDashboard (school management)
- `TEACHER` → EducatorDashboard (class management)
- `STUDENT` → LearnerDashboard (personal schedule & assignments)
- `PARENT` → GuardianDashboard (child monitoring)

---

## PROJECT STRUCTURE (TARGET)

```
Edusphere_Frontend/
├── docs/
│   ├── EDUSPHERE_MIGRATION_PLAN.md (this file)
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   └── NAMING_CONVENTIONS.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   ├── SuperAdminDashboard.tsx
│   │   │   ├── AdministratorDashboard.tsx
│   │   │   ├── EducatorDashboard.tsx
│   │   │   ├── LearnerDashboard.tsx
│   │   │   └── GuardianDashboard.tsx
│   │   ├── institutions/
│   │   ├── users/
│   │   ├── learners/
│   │   ├── educators/
│   │   ├── cohorts/
│   │   ├── courses/
│   │   ├── schedule/
│   │   ├── assessments/
│   │   ├── participation/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── settings/
│   ├── components/
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── common/
│   │   ├── forms/
│   │   └── tables/
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── institutionStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   └── config.ts
│   │   ├── auth/
│   │   │   └── authService.ts
│   │   ├── institution/
│   │   ├── user/
│   │   ├── learner/
│   │   ├── educator/
│   │   ├── cohort/
│   │   ├── course/
│   │   ├── schedule/
│   │   ├── assessment/
│   │   ├── participation/
│   │   ├── payment/
│   │   └── report/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useInstitution.ts
│   │   ├── useAsync.ts
│   │   └── useNotification.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── institution.ts
│   │   ├── user.ts
│   │   ├── learner.ts
│   │   ├── educator.ts
│   │   ├── cohort.ts
│   │   ├── course.ts
│   │   ├── schedule.ts
│   │   ├── assessment.ts
│   │   ├── participation.ts
│   │   ├── payment.ts
│   │   ├── api.ts
│   │   └── common.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   ├── storage.ts
│   │   └── logger.ts
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   └── layout/
│       ├── MainLayout.tsx
│       ├── AuthLayout.tsx
│       └── components/
├── public/
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── package.json
```

---

## FEATURE MIGRATION CHECKLIST

### ✅ PHASE 0: FOUNDATION (Pre-Migration Setup)
- [x] 🟢 **Create project structure & TypeScript configs**
  - Status: Complete ✓
  - Files: `tsconfig.json` (existing), `vite.config.ts` (existing), `tailwind.config.ts` (existing)

- [x] 🟢 **Install Zustand & required dependencies**
  - Status: Complete ✓
  - Installed: zustand, axios, react-hot-toast, date-fns
  - Package.json updated

- [x] 🟢 **Setup API client & request/response types**
  - Status: Complete ✓
  - Files Created:
    - `src/services/api/client.ts` ✓
    - `src/services/api/config.ts` ✓
  - Core Types Created:
    - `src/types/common.ts` ✓
    - `src/types/auth.ts` ✓
    - `src/types/institution.ts` ✓
    - `src/types/user.ts` ✓

- [x] 🟢 **Create TailAdmin theme & layout components**
  - Status: Complete ✓ (Already existed in project)
  - Files: AppLayout.tsx, AppHeader.tsx, AppSidebar.tsx, Backdrop.tsx
  - Theme: Dark/Light mode context preserved
  - Sidebar: SidebarContext.tsx preserved

---

### ✅ PHASE 1: AUTHENTICATION & AUTH PAGES

- [x] 🟢 **Create Auth Zustand Store**
  - Status: Complete ✓
  - Files:
    - `src/stores/authStore.ts` ✓
    - `src/types/auth.ts` ✓
  - Depends On: API Client setup ✓
  - Legacy Source: `authSlice.js`

- [x] 🟢 **Create Auth Service**
  - Status: Complete ✓
  - Files: `src/services/auth/authService.ts` ✓
  - Endpoints Implemented:
    - `POST /api/auth/login` ✓
    - `POST /api/auth/logout` ✓
    - `POST /api/auth/refresh-token` ✓
    - `POST /api/auth/forgot-password` ✓
    - `POST /api/auth/reset-password` ✓
    - `POST /api/auth/signup` ✓

- [x] 🟢 **Build Login Page**
  - Status: Complete ✓
  - Files: `src/components/auth/SignInForm.tsx` (Updated) ✓
  - Components: SignInForm (with integration), ErrorMessage, LoadingSpinner
  - Features:
    - Form state management (email, password)
    - Password visibility toggle
    - Loading states during submission
    - Error handling with toast notifications
    - Integration with Zustand auth store

- [x] 🟢 **Build Signup Page**
  - Status: Complete ✓
  - Files:
    - `src/components/auth/SignUpForm.tsx` (Updated) ✓
    - `src/types/signup.ts` ✓
    - `src/utils/signupValidation.ts` ✓
  - Features:
    - Form state management with validation
    - Role selector dropdown (6 roles)
    - Institution picker (conditional - hidden for SuperAdmin)
    - Password confirmation with visibility toggle
    - Terms & conditions checkbox
    - Comprehensive form validation
    - Error display with field-level errors
    - Loading states during submission
    - React-Hot-Toast notifications

- [x] 🟢 **Build Forgot Password Page**
  - Status: Complete ✓
  - Files:
    - `src/pages/auth/ForgotPasswordPage.tsx` ✓
    - `src/components/auth/ForgotPasswordForm.tsx` ✓
    - `src/types/forgotPassword.ts` ✓
  - Features:
    - Two-step flow: Request email → Reset password
    - Email validation
    - Password reset with token
    - Success confirmation screen
    - URL token parsing (?token=xxx)
    - Password visibility toggles
    - Comprehensive validation
    - Error handling & messages

- [x] 🟢 **Setup Protected Routes & Auth Guards**
  - Status: Complete ✓
  - Files:
    - `src/components/auth/ProtectedRoute.tsx` ✓
    - `src/App.tsx` (Updated) ✓
    - `src/hooks/useAuth.ts` ✓
  - Features:
    - Token validation on route access
    - Role-based access control
    - Auto-redirect to login if unauthorized
    - Auth restoration from localStorage on app load

---

### ✅ PHASE 2: CORE DASHBOARDS (COMPLETED)

**Legacy Dashboard Patterns Adapted:**
- ✅ SuperAdminDashboard: System stats + Institutions list + System Health monitoring
- ✅ AdministratorDashboard: Adapted from legacy SchoolAdminDashboard - Institution stats + Financial metrics + Attendance tracking
- ✅ EducatorDashboard: Adapted from legacy TeacherDashboard - Dynamic greeting + Class stats + Quick actions
- ✅ LearnerDashboard: Student view - Schedule, assignments, grade display
- ✅ GuardianDashboard: Parent view - Children overview, attendance, progress tracking

**Completed Deliverables:**
- ✅ **DashboardRouter.tsx** - Role-based routing to 5 dashboards with lazy loading
- ✅ **SuperAdminDashboard.tsx** - System administration view (6 stat cards + Health monitoring)
- ✅ **AdministratorDashboard.tsx** - Institution management (6 stat cards + Financial + Attendance)
- ✅ **EducatorDashboard.tsx** - Teacher dashboard (6 stat cards + Cohorts section + Actions)
- ✅ **LearnerDashboard.tsx** - Student dashboard (6 stat cards + Grade display + Assignments)
- ✅ **GuardianDashboard.tsx** - Parent dashboard (5 stat cards + Children section + Communications)
- ✅ **StatCard.tsx** - Reusable metric card component with 8 color schemes
- ✅ **App.tsx Integration** - Updated to use DashboardRouter at `/` route

**Features Implemented:**
- ✅ All dashboards with mock data (TODO comments for API integration)
- ✅ Loading states with skeleton animations
- ✅ Error handling with retry buttons
- ✅ Full dark mode support
- ✅ Responsive grid layouts (responsive columns)
- ✅ Quick Action buttons (emoji-based, no icon library needed)
- ✅ Statistics with optional trend indicators
- ✅ Additional dashboard sections (Institution list, System health, Attendance bars, etc.)
- ✅ Last updated timestamp display
- ✅ Role-based dashboard selection (SUPER_ADMIN → SuperAdminDashboard, etc.)
- ✅ Lazy loading with Suspense for performance

---

### ⏳ PHASE 3: INSTITUTION MANAGEMENT
- [ ] 🔴 **Create Institution Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/institutionStore.ts`
    - `src/services/institution/institutionService.ts`
  - Endpoints Used:
    - `GET /api/institutions`
    - `POST /api/institutions`
    - `PUT /api/institutions/{id}`

- [ ] 🔴 **Build Institution List Page**
  - Status: Pending
  - Files: `src/pages/institutions/InstitutionListPage.tsx`

- [ ] 🔴 **Build Institution Create/Edit Page**
  - Status: Pending
  - Files: `src/pages/institutions/InstitutionFormPage.tsx`

---

### ⏳ PHASE 4: USER MANAGEMENT
- [ ] 🔴 **Create User Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/userStore.ts`
    - `src/services/user/userService.ts`
  - Endpoints Used:
    - `GET /api/users`
    - `POST /api/users`
    - `PUT /api/users/{id}`
    - `DELETE /api/users/{id}`

- [ ] 🔴 **Build User List Page**
  - Status: Pending
  - Files: `src/pages/users/UserListPage.tsx`

- [ ] 🔴 **Build User Create/Edit Page**
  - Status: Pending
  - Files: `src/pages/users/UserFormPage.tsx`

---

### ⏳ PHASE 5: LEARNER MANAGEMENT
- [ ] 🔴 **Create Learner Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/learnerStore.ts`
    - `src/services/learner/learnerService.ts`
  - Endpoints Used:
    - `GET /api/students`
    - `POST /api/students`
    - `PUT /api/students/{id}`

- [ ] 🔴 **Build Learner List Page**
  - Status: Pending
  - Files: `src/pages/learners/LearnerListPage.tsx`

- [ ] 🔴 **Build Learner Detail Page**
  - Status: Pending
  - Files: `src/pages/learners/LearnerDetailPage.tsx`

---

### ⏳ PHASE 6: EDUCATOR MANAGEMENT
- [ ] 🔴 **Create Educator Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/educatorStore.ts`
    - `src/services/educator/educatorService.ts`
  - Endpoints Used:
    - `GET /api/teachers`
    - `POST /api/teachers`
    - `PUT /api/teachers/{id}`

- [ ] 🔴 **Build Educator List Page**
  - Status: Pending
  - Files: `src/pages/educators/EducatorListPage.tsx`

---

### ⏳ PHASE 7: COHORT & COURSE MANAGEMENT
- [ ] 🔴 **Create Cohort Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/cohortStore.ts`
    - `src/services/cohort/cohortService.ts`
  - Endpoints Used:
    - `GET /api/classes`
    - `POST /api/classes`
    - `PUT /api/classes/{id}`

- [ ] 🔴 **Create Course Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/courseStore.ts`
    - `src/services/course/courseService.ts`
  - Endpoints Used:
    - `GET /api/subjects`
    - `POST /api/subjects`
    - `PUT /api/subjects/{id}`

---

### ⏳ PHASE 8: SCHEDULE & TIMETABLE
- [ ] 🔴 **Create Schedule Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/scheduleStore.ts`
    - `src/services/schedule/scheduleService.ts`
  - Endpoints Used:
    - `GET /api/timetable`
    - `POST /api/timetable`
    - `PUT /api/timetable/{id}`

- [ ] 🔴 **Build Schedule View Page (FullCalendar)**
  - Status: Pending
  - Files: `src/pages/schedule/ScheduleViewPage.tsx`

---

### ⏳ PHASE 9: ASSESSMENTS & PARTICIPATION
- [ ] 🔴 **Create Assessment Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/assessmentStore.ts`
    - `src/services/assessment/assessmentService.ts`
  - Endpoints Used:
    - `GET /api/exams`
    - `POST /api/exams`
    - `GET /api/marks`
    - `POST /api/marks`

- [ ] 🔴 **Create Participation Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/participationStore.ts`
    - `src/services/participation/participationService.ts`
  - Endpoints Used:
    - `GET /api/attendance`
    - `POST /api/attendance`

---

### ⏳ PHASE 10: PAYMENTS & REPORTS
- [ ] 🔴 **Create Payment Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/paymentStore.ts`
    - `src/services/payment/paymentService.ts`
  - Endpoints Used:
    - `GET /api/fees`
    - `POST /api/fees`

- [ ] 🔴 **Create Report Store & Service**
  - Status: Pending
  - Files:
    - `src/stores/reportStore.ts`
    - `src/services/report/reportService.ts`
  - Endpoints Used:
    - `GET /api/progress-cards`
    - `POST /api/progress-cards`

---

### ⏳ PHASE 11: SETTINGS & ADMIN PANELS
- [ ] 🔴 **Build Settings Page**
  - Status: Pending
  - Files: `src/pages/settings/SettingsPage.tsx`

- [ ] 🔴 **Build Profile Page**
  - Status: Pending
  - Files: `src/pages/settings/ProfilePage.tsx`

---

### ⏳ PHASE 12: FINAL INTEGRATION & TESTING
- [ ] 🔴 **End-to-End Testing**
  - Status: Pending
  - Test all critical user journeys

- [ ] 🔴 **Performance Optimization**
  - Status: Pending
  - Code splitting, lazy loading, caching

- [ ] 🔴 **Accessibility Audit**
  - Status: Pending
  - WCAG 2.1 AA compliance

---

## COMPLETED TASKS

### Completed in This Session (2026-01-02)

**Phase 0: Foundation (COMPLETED)**
- ✅ Created `/docs/EDUSPHERE_MIGRATION_PLAN.md` - Master migration tracker
- ✅ Installed Zustand + Axios + React-Hot-Toast + Date-fns
- ✅ Created API configuration (`src/services/api/config.ts`)
- ✅ Created API client with interceptors (`src/services/api/client.ts`)
- ✅ Created core TypeScript types:
  - ✅ `src/types/common.ts` - Common types, enums, roles
  - ✅ `src/types/auth.ts` - Auth request/response types
  - ✅ `src/types/institution.ts` - Institution types
  - ✅ `src/types/user.ts` - User management types

**Phase 1: Authentication (COMPLETED - 6/6 Tasks ✅)**
- ✅ Created Auth Service (`src/services/auth/authService.ts`)
  - login, logout, refreshToken, forgotPassword, resetPassword, signup
- ✅ Created Auth Zustand Store (`src/stores/authStore.ts`)
  - State: user, isAuthenticated, loading, error
  - Actions: login, logout, refreshToken, restoreAuth, setUser, clearError
- ✅ Created useAuth hook (`src/hooks/useAuth.ts`)
- ✅ Built Login Page with full integration (`src/components/auth/SignInForm.tsx`)
  - Connected to Zustand store
  - Form submission handler
  - Loading states and error handling
  - React-hot-toast notifications
- ✅ Built SignUp Page with comprehensive features
  - Form state management with validation
  - Role selector (6 roles: SuperAdmin, Admin, Leadership, Educator, Learner, Guardian)
  - Conditional institution picker (shown for all except SuperAdmin)
  - Password confirmation with visibility toggle
  - Terms & conditions agreement
  - Field-level error messages
  - Loading states and notifications
- ✅ Built Forgot Password Page with two-step flow
  - Step 1: Request password reset email
  - Step 2: Reset password with token
  - Success confirmation screen
  - URL token parsing for direct reset links
  - Password visibility toggles
  - Comprehensive validation
- ✅ Created ProtectedRoute component (`src/components/auth/ProtectedRoute.tsx`)
  - Validates authentication
  - Checks role-based access
  - Redirects to login if needed
  - Loading state handling
- ✅ Updated App.tsx
  - Added auth restoration on app load
  - Wrapped dashboard routes with ProtectedRoute
  - Integrated Toaster for notifications
  - Separated auth routes from protected routes
  - Added forgot password route

### Files Created (Phase 1 - Authentication)
- `/src/types/signup.ts` - Signup form types & validation interfaces
- `/src/types/forgotPassword.ts` - Forgot password types
- `/src/services/auth/authService.ts` - Auth API service
- `/src/stores/authStore.ts` - Zustand auth store
- `/src/hooks/useAuth.ts` - useAuth hook
- `/src/components/auth/ProtectedRoute.tsx` - Protected route wrapper
- `/src/components/auth/ForgotPasswordForm.tsx` - Forgot password form
- `/src/pages/auth/ForgotPasswordPage.tsx` - Forgot password page
- `/src/utils/signupValidation.ts` - Signup validation utilities

### Files Modified (Phase 1)
- `/src/components/auth/SignInForm.tsx` - Full auth integration
- `/src/components/auth/SignUpForm.tsx` - Full form integration
- `/src/App.tsx` - Auth flow, protected routes, forgot password route

**Dependencies Installed:**
- zustand@^4.x
- axios@^1.x
- react-hot-toast@^2.x
- date-fns@^2.x

---

## CURRENT WORK IN PROGRESS

**Phase 1: Authentication - In Progress**
- Currently focused on completing base authentication infrastructure
- Next: Build SignUp page integration and create signup form handler

---

## KEY ARCHITECTURAL DECISIONS

### 1. **State Management: Zustand Only**
- ✅ No Redux, no Redux Thunk
- ✅ Zustand stores handle both state and async logic
- ✅ Minimal boilerplate, maximum clarity

### 2. **Service Layer Pattern**
- ✅ All API calls isolated in `src/services/`
- ✅ One service per domain (auth, learner, educator, etc.)
- ✅ Shared API client with centralized error handling

### 3. **TypeScript Strict Mode**
- ✅ Full type safety across the application
- ✅ Branded types for domain entities
- ✅ Type-safe API responses

### 4. **TailAdmin + Tailwind CSS**
- ✅ Consistent theming
- ✅ No inline styles
- ✅ Dark mode support built-in

### 5. **Feature-Based Directory Structure**
- ✅ Organize by domain, not by file type
- ✅ `src/pages/learners/`, `src/services/learner/`, `src/stores/learnerStore.ts`
- ✅ Scalable and easy to maintain

---

## API CONTRACTS REFERENCE

**Backend Base URL:** `http://localhost:5000/api/`

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Institutions (SuperAdmin)
```
GET /api/institutions
POST /api/institutions
GET /api/institutions/{id}
PUT /api/institutions/{id}
DELETE /api/institutions/{id}
```

### Users
```
GET /api/users
POST /api/users
GET /api/users/{id}
PUT /api/users/{id}
DELETE /api/users/{id}
```

### Students
```
GET /api/students
POST /api/students
GET /api/students/{id}
PUT /api/students/{id}
```

### Teachers
```
GET /api/teachers
POST /api/teachers
GET /api/teachers/{id}
```

### Classes
```
GET /api/classes
POST /api/classes
GET /api/classes/{id}
```

### Subjects
```
GET /api/subjects
POST /api/subjects
GET /api/subjects/{id}
```

### Attendance
```
GET /api/attendance
POST /api/attendance
GET /api/attendance/{id}
```

### Exams & Marks
```
GET /api/exams
POST /api/exams
GET /api/marks
POST /api/marks
```

### Fees
```
GET /api/fees
POST /api/fees
GET /api/fees/{id}
```

### Timetable
```
GET /api/timetable
POST /api/timetable
```

### Progress Cards
```
GET /api/progress-cards
POST /api/progress-cards
```

---

## DEPENDENCIES

### Already Installed
- ✅ React 19
- ✅ React Router v7
- ✅ Tailwind CSS v4
- ✅ TypeScript 5.7
- ✅ Vite 6

### To Install
- [ ] **zustand** - State management
- [ ] **axios** - HTTP client (or keep fetch)
- [ ] **react-helmet-async** - Document head management
- [ ] **react-hot-toast** - Notifications
- [ ] **date-fns** - Date formatting
- [ ] **zod** - Schema validation
- [ ] **clsx** - Conditional classnames (already included)

---

## MIGRATION STRATEGY

### For Each Feature:
1. **Analyze Legacy Code**
   - Identify Redux logic
   - List API endpoints used
   - Note validation rules

2. **Create Types** (`src/types/`)
   - Define request/response models
   - Use branded types for IDs

3. **Create Service** (`src/services/`)
   - API calls only
   - Error handling
   - Type-safe responses

4. **Create Store** (`src/stores/`)
   - State shape
   - Async thunks
   - Actions/mutations

5. **Build UI Components**
   - TailAdmin-based
   - Tailwind CSS styling
   - Generic terminology

6. **Create Page** (`src/pages/`)
   - Container component
   - Uses store + service
   - Handles routing

7. **Test End-to-End**
   - All user flows
   - Error scenarios
   - Edge cases

---

## NOTES FOR DEVELOPERS

### Code Style Guidelines
- Use **TypeScript strict** mode
- No `any` types
- Prefer `const` over `let`
- Use **PascalCase** for components
- Use **camelCase** for functions/variables
- Use **SCREAMING_SNAKE_CASE** for constants

### File Naming
- Components: `ComponentName.tsx`
- Pages: `PageName.tsx`
- Stores: `storeNameStore.ts`
- Services: `serviceNameService.ts`
- Types: `typeName.ts` or in a `types/` folder
- Hooks: `useHookName.ts`

### Component Structure
```typescript
import { FC } from 'react';
import { useSomeStore } from '@/stores/someStore';

interface Props {
  prop1: string;
  prop2?: number;
}

const ComponentName: FC<Props> = ({ prop1, prop2 = 0 }) => {
  const { state, action } = useSomeStore();

  return (
    <div>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Store Structure (Zustand)
```typescript
import { create } from 'zustand';
import { StoreService } from '@/services/store/storeService';

interface State {
  items: Item[];
  loading: boolean;
  error: string | null;
}

interface Actions {
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useStoreStore = create<State & Actions>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true });
    try {
      const items = await StoreService.getItems();
      set({ items, error: null });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (item: Item) => {
    // Implementation
  },

  deleteItem: async (id: string) => {
    // Implementation
  },
}));
```

---

## NEXT STEPS (Prioritized)

### ✅ COMPLETED (Phase 0 & Phase 1 & Phase 2)
1. ✅ Create migration plan ✓
2. ✅ Install Zustand + dependencies ✓
3. ✅ Setup API client & TypeScript types ✓
4. ✅ Setup protected routes & auth ✓
5. ✅ Build SignUp page with role & institution selection ✓
6. ✅ Build Forgot Password page with 2-step flow ✓
7. ✅ Create role-based dashboard router ✓
8. ✅ Build SuperAdmin Dashboard ✓
9. ✅ Build Administrator Dashboard ✓
10. ✅ Build Educator Dashboard ✓
11. ✅ Build Learner Dashboard ✓
12. ✅ Build Guardian Dashboard ✓

### 🔄 PHASE 3 (Institution Management) - NEXT PRIORITY
13. Create Institution Store & Service
    - `src/stores/institutionStore.ts`
    - `src/services/institution/institutionService.ts`
    - Endpoints: GET/POST/PUT /api/institutions

14. Build Institution Management Pages
    - `src/pages/institutions/InstitutionListPage.tsx`
    - `src/pages/institutions/InstitutionFormPage.tsx`
    - Adapt from legacy school_frontend/pages/school_management

### Phase 4+ (After Institution Management)
15. User management (CRUD)
16. Learner management (CRUD)
17. Educator management (CRUD)
18. Cohort & Course management
19. Schedule/Timetable
20. Assessments & Participation
21. Payments & Reports
22. Settings & Profile pages
23. End-to-end testing & optimization

---

## REFERENCE: LEGACY ARCHITECTURE ANALYSIS

### From school-management-frontend Deep Dive (2026-01-02)

**Key Dashboard Patterns to Adopt:**
1. **StatsCard Component** - Icon + Title + Value + Color
   - Props: title, value, icon, iconColor, subtitle, bgColor
   - Implementation: Use TailAdmin card + icon library

2. **MainCard Container** - Page content wrapper
   - Blue top border (5px), consistent padding
   - HeaderCard for page titles with breadcrumbs and action buttons

3. **Data Fetching Pattern** - useEffect + useState + API call
   - Load data on component mount
   - Handle loading/error states
   - Display loading skeleton while fetching
   - Show error with retry button

4. **Form Pattern** - useState for form state + validation
   - Manual validation before submit
   - Field-level error messages that clear on change
   - Toast notifications for success/error

5. **Table Pattern** - Ant Design Table with columns
   - Sorting, filtering, pagination built-in
   - Context menu (More options) with actions
   - Row selection and bulk operations

**Page Categories to Migrate (Priority Order):**
- Phase 2: Dashboards (5 role-specific dashboards)
- Phase 3: Institution Management (CRUD)
- Phase 4: User Management (CRUD)
- Phase 5: Learner Management (list, create, details)
- Phase 6: Educator Management (list, create)
- Phase 7: Cohort & Course Management
- Phase 8: Schedule & Timetable
- Phase 9: Assessments & Participation (Attendance, Marks)
- Phase 10: Payments & Reports
- Phase 11: Settings & Profile pages

**Key Components to Build (TailAdmin Equivalents):**
- ✅ StatsCard (animated metric display)
- ✅ MainCard/PageContainer (content wrapper)
- HeaderCard (page header with breadcrumbs) - EXISTS in layout
- DataTable (with sorting/filtering) - Use Tailwind + custom
- Dialog/Modal (for CRUD operations)
- Loader/Spinner (animated loading)
- FormControl/FormSelect (consistent form styling)
- Breadcrumbs (navigation)
- Avatar (user profiles)

**API Response Format to Expect:**
```json
{
  "code": 200,
  "status": "success",
  "message": "Data fetched",
  "data": { /* actual data */ },
  "access_token": "jwt-token",
  "current_academic_year": { /* year object */ }
}
```

**Common Validation Patterns:**
- Required fields
- Email regex: `/\S+@\S+\.\S+/`
- Phone: `/^\d{10}$/` (India format)
- Date validation with day's before today

**Menu/Navigation Pattern:**
- Sidebar with role-based menu filtering
- Each menu item has `roles: ['ROLE1', 'ROLE2']` array
- Menu structure: NavGroups → NavItems/NavCollapse
- Active state highlighting on current route

---

## CONTACT & SUPPORT

For questions, blockers, or clarifications:
- Review this plan file
- Check legacy frontend at `D:\School_management\school-management-frontend`
- Check backend API at `D:\School_management\school-management-backend`
- Reference backend CLAUDE.md for API contracts

---

**Last Updated:** 2026-01-02 21:15 UTC
**Status:** 🟢 Phase 0, 1, & 2 FULLY COMPLETE ✅ (Ready for Phase 3 - Institution Management)

## PROGRESS SUMMARY

| Phase | Status | Progress | Details |
|-------|--------|----------|---------|
| Phase 0: Foundation | ✅ Done | 4/4 | All infrastructure setup complete |
| Phase 1: Authentication | ✅ Done | 6/6 | Login, SignUp, Forgot Password all complete |
| Phase 2: Dashboards | ✅ Done | 5/5 | All 5 role-specific dashboards + Router |
| Phase 3: Institution Mgmt | ⏳ Next | 0/2 | CRUD for institutions |
| Phase 4-12 | ⏳ Pending | 0/38+ | Remaining features |

**Overall Progress:** ~40% (15 tasks of ~42 core tasks completed)

**PHASE 2 DASHBOARD IMPLEMENTATION SUMMARY:**
- ✅ StatCard component with 8 color schemes and animations
- ✅ DashboardRouter with role-based rendering and lazy loading
- ✅ SuperAdminDashboard - System stats + Institution management
- ✅ AdministratorDashboard - Institution stats + Financial metrics + Attendance
- ✅ EducatorDashboard - Dynamic greeting + Class management + Quick actions
- ✅ LearnerDashboard - Schedule, assignments, grade display
- ✅ GuardianDashboard - Children overview, attendance, communications
- ✅ All dashboards with loading states, error handling, dark mode
- ✅ Mock data integrated (ready for API replacement via TODO comments)
- ✅ App.tsx updated to use DashboardRouter
