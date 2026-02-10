# site-worker-mobile Agent Rules

## 1. Core Principles

* Frontend-only project
* Backend is the source of truth
* Mobile-first UX (touch, one-hand usage)
* PWA limitations must be respected

---

## 2. Architecture Rules

### Layer Responsibilities

* pages/

  * Orchestrates user flow only
  * No direct API, storage, or device access
  * Uses `lib/queries/` hooks for data, `lib/storage.ts` wrappers via lib layer

* components/

  * Pure UI and layout
  * No business rules
  * Exception: `QrScanner.tsx`, `LocationPermissionPopup.tsx` encapsulate device integration (camera, geolocation)

* components/ui/

  * Shared design system primitives (Button, Input, Select, OptionCard, Spinner, etc.)
  * Uses shadcn/ui conventions, CVA for variants, `cn()` for class merging
  * Pages must use shared components — no raw `<button>`, `<input>`, `<select>` with inline styles

* lib/

  * API calls (`auth.ts`, `attendance.ts`, `profile.ts`, `contract.ts`)
  * Domain logic (`qr.ts`)
  * Storage access (`storage.ts`)
  * Error infrastructure (`errorReporter.ts`, `globalErrorHandlers.ts`, `api-result.ts`)

* lib/queries/

  * React Query hooks wrapping `lib/` API functions
  * One hook per data domain (`useMonthlyAttendance`, `useWorkerProfile`, `useContracts`, `useChangePassword`)
  * Pages fetch data through these hooks, never through raw `lib/` API calls
  * `staleTime: Infinity` for data that rarely changes

* contexts/

  * React Context providers for cross-cutting state
  * `AuthContext.tsx` — login/logout/token state
  * `ToastContext.tsx` — global toast notifications (`showSuccess`, `showError`, `showInfo`)

* hooks/

  * Reusable custom hooks not tied to a specific page
  * Currently: `useHoneypot.ts`

* utils/

  * Pure functions only (formatting, date math, data transforms)
  * Exception: `geolocation.ts` wraps browser geolocation API

* i18n/

  * Internationalization config and translation files
  * Languages: Korean (ko), English (en)
  * Namespaces: `common`, `login`

---

## 3. Domain Rules (Attendance)

* Check-in / check-out time uses backend timestamp only
* Client timestamp is UI reference only
* Location data is evidence, not authority
* QR scan is a trigger, not a validation

---

## 4. Storage Rules

* Offline storage is UX cache only
* Never trust cached attendance state
* Auth tokens must always handle expiration
* Never access localStorage/sessionStorage directly — use typed wrappers in `lib/storage.ts`:
  * `authStorage` — refresh token, expiresIn, issuedAt
  * `engineerStorage` — engineer form draft (engineerType, representativeName, machine)
  * `onboardingStorage` — onboarding completion flag
  * `signupStorage` — phone number (sessionStorage, cleared on tab close)
  * `fileStorage` — binary files via IndexedDB

---

## 5. Auth Token Rules

* Access token: held **in-memory only** (`lib/auth.ts` module variable), lost on reload
* Refresh token: stored in localStorage via `authStorage`
* On reload: `AuthContext` calls `refreshAccessToken()` → restores access token → calls `fetchUserInfo()` → restores user state
* `refreshAccessToken()` deduplicates concurrent calls via singleton promise (handles StrictMode double-mount)
* All API calls must use `authFetch()` which auto-refreshes expired tokens (proactive check + 401 fallback)
* Token expiry check uses 30-second buffer before actual expiry

---

## 6. API Rules

* All backend responses follow shape: `{ code?, message?, data }`
* Unwrap with: `const payload = responseData.data || responseData`
* API functions live in `lib/` (`auth.ts`, `attendance.ts`, `profile.ts`, `contract.ts`)
* Pages access data via `lib/queries/` hooks, never via raw `lib/` API calls
* Tenant context sent via `X_TENANT_ID` header (configured in `lib/config.ts`)

---

## 7. Error Handling Rules

### Unified Error Type

* All `lib/` API functions return `ApiResult<T>` (defined in `lib/api-result.ts`):
  ```ts
  type ApiResult<T> = { success: true; data: T } | { success: false; error: string }
  ```
* JSON parsing uses `safeJson()` instead of raw `response.json()` — returns `null` on malformed responses
* React Query `queryFn` functions throw on `!result.success` so React Query exposes `isError`

### Error Boundary

* `ErrorBoundary` (class component) wraps the entire app in `App.tsx`
* Catches React render crashes, shows fallback UI with retry button
* Reports via `reportError('RENDER_CRASH', ...)`

### Toast System

* `ToastProvider` + `useToast()` hook in `contexts/ToastContext.tsx`
* `ToastContainer` renders at app root (in `App.tsx`)
* Three variants: `showSuccess`, `showError`, `showInfo` — auto-dismiss in 3 seconds
* Use `useToast()` instead of `alert()` or `window.alert()`

### Query Error States

* Pages using React Query display `QueryErrorState` component on `isError`
* Shows error message + retry button that calls `refetch()`

### Client Error Reporting

* `lib/errorReporter.ts` — collects errors, deduplicates (same code within 60s), batches (flush every 10s)
* `lib/globalErrorHandlers.ts` — catches unhandled JS errors and promise rejections
* 22 error sites across the codebase report via `reportError(code, message, extra?)`
* Error codes follow pattern: `DOMAIN_ACTION_RESULT` (e.g. `AUTH_LOGIN_FAIL`, `CHECKIN_API_FAIL`)
* Endpoint configured via `configureErrorReporter()` in `main.tsx` (placeholder until backend provides URL)
* Never include tokens, passwords, or PII in error payloads — only `workerId` for correlation

---

## 8. UI Rules

* Use shadcn/ui as the base
* Touch-friendly spacing (min 44px)
* No inline styles inside pages
* Consistent typography and color usage
* Brand colors: primary `#007DCA`, secondary `#33D4C1`, accent `#F6B26B`

---

## 9. Routing Rules

* Routes defined in `App.tsx`
* Public routes (login, signup) wrapped with `<PublicRoute>` — redirects to home if already authenticated
* Protected routes require auth — redirects to login if not authenticated
* Worker-only routes — no management or admin routes allowed

---

## 10. Build & Dev

* `npm run dev` — Vite dev server (port 5200)
* `npm run build` — production build
* `npx tsc --noEmit` — type check (no ESLint configured)
* API proxy: `/api` → backend server (configured in `vite.config.ts`)

---

# Subagents

## UI / Design System Subagent

**Scope**

* components/ui/

**Responsibilities**

* Maintain shadcn/ui conventions
* Enforce spacing, font size, accessibility

---

## Layout & Navigation Subagent

**Scope**

* components/layout/

**Responsibilities**

* Header / BottomNav consistency
* Navigation state isolation

---

## Auth & Session Subagent

**Scope**

* contexts/AuthContext.tsx
* lib/auth.ts
* lib/storage.ts (authStorage)

**Responsibilities**

* Login / logout flow
* Token lifecycle (in-memory access + localStorage refresh)
* Session recovery UX

---

## Attendance Domain Subagent

**Scope**

* lib/attendance.ts
* lib/qr.ts

**Responsibilities**

* Check-in / out logic
* QR + location orchestration

---

## Location & Device Capability Subagent

**Scope**

* utils/geolocation.ts
* components/ui/LocationPermissionPopup.tsx

**Responsibilities**

* Permission handling
* PWA capability limits

---

## Offline & Storage Strategy Subagent

**Scope**

* lib/storage.ts

**Responsibilities**

* Cache vs source-of-truth separation
* Offline-safe UX

---

## API Contract Guard Subagent

**Scope**

* lib/*.ts

**Responsibilities**

* Backend response validation
* Error shape normalization

---

# Home Page Agent Architecture Rules

> This pattern applies to the Home page only (`pages/home/`). Other pages use standard hooks.

### 1. Layer Responsibilities
- Home.tsx: UI rendering only
- useHomeAgent: orchestration only
- use*Agent (pages/home/agents/): domain decisions and workflows
- *.skill.ts (pages/home/agents/*/skills/): pure, stateless, side-effect isolated

### 2. Skill Rules
- Skills must not:
  - import React
  - use useState/useEffect
  - access UI components
- Skills may:
  - call APIs
  - read/write storage
  - perform pure calculations

### 3. Agent Rules
- UI must never call skills directly
- All domain logic must go through agents
- Each domain has exactly one unified agent

### 4. Dependency Direction
UI → Agent → Skill
(No reverse dependencies allowed)

---

# Rule Violation Judgment Guide

## Priority

1. Backend truth vs client convenience
2. Domain integrity over UI simplicity
3. Architecture consistency over speed

---

## Common Violation Examples

### Page directly calls API

* Why invalid: Breaks layer responsibility
* Fix: Use `lib/queries/` hook or create one wrapping a `lib/` function

---

### Attendance time taken from client clock

* Why invalid: Device clock is mutable
* Fix: Always use backend timestamp

---

### Storing authoritative data in localStorage

* Why invalid: Storage is not trustworthy
* Fix: Cache UI state only

---

### Raw localStorage/sessionStorage access

* Why invalid: Bypasses typed wrappers, no key consistency
* Fix: Use named wrappers in `lib/storage.ts`

---

### UI component contains business logic

* Why invalid: UI must remain reusable
* Fix: Lift logic into page or lib layer

---

### Raw HTML elements where shared component exists

* Why invalid: Inconsistent styling, duplicated patterns
* Fix: Use `components/ui/` shared components (Button, Input, Select, OptionCard, Spinner)

---

## When Unsure

Ask:

* Is this data authoritative?
* Does this logic belong to a domain?
* Would this break if offline or reloaded?

If unsure, defer to the stricter rule.
