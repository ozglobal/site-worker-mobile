# site-worker-mobile — Agent Rules

> Mobile-first PWA for construction site workers. Frontend only — backend is the source of truth.

---

## TL;DR (read first)

| Topic | Rule |
|---|---|
| **Data flow** | Pages → `lib/queries/` hooks → `lib/*.ts` API functions. Never Pages → `lib/*.ts` directly. |
| **Fetching** | Use `authFetch()` (authed) or `loggedFetch()` (public). Both auto-log. Never call `fetch()` directly. |
| **Storage** | Use typed wrappers in `lib/storage.ts`. Never touch `localStorage` / `sessionStorage` directly. |
| **Auth token** | Access token = in-memory only. Refresh token = `localStorage` via `authStorage`. |
| **Attendance time** | Always backend timestamp. Client clock is UI hint only. |
| **UI primitives** | Use `components/ui/` (Button, Input, Select, OptionCard, Spinner…). No raw `<button>` / `<input>`. |
| **Errors** | `lib/` returns `ApiResult<T>`. User feedback via `useToast()`, never `alert()`. Report via `reportError(code, msg, extra?)`. |
| **i18n** | All user-facing text goes through `react-i18next`. |

---

## 1. Core Principles

- Frontend-only project
- Backend is the source of truth
- Mobile-first UX (touch, one-hand usage, min 44px tap targets)
- PWA limitations must be respected

---

## 2. Architecture — Layer Responsibilities

### `pages/`
- Orchestrates user flow only
- No direct API / storage / device access
- Consumes data through `lib/queries/` hooks

### `components/`
- Pure UI and layout — no business rules
- Exception: `QrScanner.tsx`, `LocationPermissionPopup.tsx` (device integration)

### `components/ui/`
- Shared design-system primitives (shadcn/ui conventions, CVA variants, `cn()` for class merge)
- Pages must reuse these — no raw `<button>` / `<input>` / `<select>` with inline styles

### `lib/`
| File | Purpose |
|---|---|
| `auth.ts` | Auth API + `authFetch` + `loggedFetch` + in-memory token |
| `attendance.ts` | Attendance API calls |
| `profile.ts` | Profile API calls |
| `contract.ts` | Employment contract API |
| `notice.ts` | Notification inbox API |
| `upload.ts` | File upload (uses `authFetch`) |
| `juso.ts` | Korean address lookup (public API) |
| `qr.ts` | QR parsing (domain logic) |
| `storage.ts` | Typed `localStorage` / `sessionStorage` / IndexedDB wrappers |
| `config.ts` | `API_BASE_URL`, `X_TENANT_ID` |
| `api-result.ts` | `ApiResult<T>` type + `safeJson()` |
| `errorReporter.ts` | Client error queue, dedup, batch flush |
| `globalErrorHandlers.ts` | `window.error` + `unhandledrejection` hooks |
| `utils.ts` | shadcn `cn()` helper |

### `lib/queries/`
- React Query hooks wrapping `lib/*.ts` functions — one hook per data domain
- Current: `useWorkerProfile`, `useWorkerDocuments`, `useDailyAttendance`, `useMonthlyAttendance`, `useContracts`, `useChangePassword`, `useActivePartners`, `useNotices`
- Pages fetch through these hooks — never raw `lib/` functions
- `staleTime: Infinity` for data that rarely changes

### `contexts/`
- `AuthContext.tsx` — login/logout/token lifecycle
- `ToastContext.tsx` — global toasts (`showSuccess`, `showError`, `showInfo`)

### `hooks/`
- Reusable custom hooks (currently only `useHoneypot.ts`)

### `utils/`
- Pure functions only: `time.ts`, `format.ts`, `attendance.ts`, `devLog.ts`
- Exception: `geolocation.ts` (browser geolocation wrapper)

### `i18n/`
- `react-i18next`, languages: `ko`, `en`
- Namespaces: `common`, `login`

---

## 3. Domain Rules — Attendance

- Check-in / check-out time → **backend timestamp only**
- Client timestamp is UI reference, never authority
- Location data is **evidence**, not authority
- QR scan is a **trigger**, not a validation

---

## 4. Storage Rules

- **Cache only** — never trust `localStorage` for authoritative state
- Auth tokens must always handle expiration
- Use these typed wrappers in `lib/storage.ts`:

| Wrapper | Contents | Backend |
|---|---|---|
| `authStorage` | refresh token, `expiresIn`, `issuedAt` | localStorage |
| `workerStorage` | cached worker id / name / site | localStorage |
| `engineerStorage` | engineer form draft | localStorage |
| `onboardingStorage` | onboarding completion flag | localStorage |
| `signupStorage` | phone during signup | **sessionStorage** (cleared on tab close) |
| `fileStorage` | binary files | IndexedDB |

`clearAllStorage()` wipes everything on logout.

---

## 5. Auth Token Rules

- **Access token** — in-memory only (`inMemoryAccessToken` in `lib/auth.ts`). Lost on reload.
- **Refresh token** — `localStorage` via `authStorage`.
- **On reload**: `AuthContext` → `refreshAccessToken()` restores access token → `fetchUserInfo()` restores worker state.
- `refreshAccessToken()` **deduplicates** concurrent calls via `refreshInFlight` singleton promise (handles StrictMode double-mount and race conditions).
- All authed API calls **must** use `authFetch()` — it auto-refreshes on proactive expiry check (30s buffer) and on 401 fallback.
- Unauthenticated calls (login, refresh, SMS, password reset, register) use `loggedFetch()`.

---

## 6. API Rules

- Response shape: `{ code?, message?, data }`. Unwrap with `const payload = responseData.data || responseData`.
- API functions live in `lib/*.ts`.
- Pages access data via `lib/queries/` hooks — never raw `lib/` calls.
- Tenant context: `X-Tenant-Id` header, value in `lib/config.ts` (`X_TENANT_ID`).
- **Never call `fetch()` directly** — use `authFetch` (authed) or `loggedFetch` (public). They handle token, tenant header, and logging.

### Auto-logging (both wrappers)
- Produces a single collapsed `[api] METHOD /endpoint  <status>  <Xms>` group per call, containing `[request]` and `[RESPONSE]`.
- For sensitive request bodies, pass a redacted override:
  ```ts
  loggedFetch(url, { method: 'POST', body: JSON.stringify(params) }, { ...params, password: '***' })
  ```
- `utils/devLog.ts` also exports `logDebug`, `logError`, `logApiSummary` for ad-hoc logs (DEV-only).

---

## 7. Error Handling Rules

### Unified result type

All `lib/` API functions return `ApiResult<T>` (`lib/api-result.ts`):
```ts
type ApiResult<T> = { success: true; data: T } | { success: false; error: string }
```
- JSON parsing uses `safeJson()` — returns `null` on malformed responses (no throw).
- React Query `queryFn` throws on `!result.success` so `isError` is exposed.

### Error boundary
- `ErrorBoundary` (class component) wraps the app in `App.tsx`.
- Catches render crashes → fallback UI with retry → reports `RENDER_CRASH`.

### Toasts
- `ToastProvider` + `useToast()` (`contexts/ToastContext.tsx`). `ToastContainer` rendered at app root.
- Variants: `showSuccess`, `showError`, `showInfo` — 3s auto-dismiss.
- **Use `useToast()`, never `alert()` / `window.alert()`.**

### Query error states
- Pages on `isError` → render `QueryErrorState` component with retry calling `refetch()`.

### Client error reporting
- `lib/errorReporter.ts` — queue + dedup (same code within 60s) + batch flush (every 10s, max 50 entries).
- `lib/globalErrorHandlers.ts` — `window.error` + `unhandledrejection` hooks (installed in `main.tsx`).
- Call `reportError(code, message, extra?)` at failure sites.
- **Error code pattern:** `DOMAIN_ACTION_RESULT` — e.g. `AUTH_LOGIN_FAIL`, `CHECKIN_API_FAIL`, `AUTH_SESSION_EXPIRED`.
- Endpoint configured via `configureErrorReporter()` in `main.tsx` (placeholder until backend provides URL).
- **Never include** tokens, passwords, PII in payloads. Only `workerId` for correlation.

---

## 8. UI Rules

- shadcn/ui as the base
- Touch-friendly spacing (min 44px tap targets)
- No inline styles inside pages
- Consistent typography / color usage
- Brand colors: primary `#007DCA`, secondary `#33D4C1`, accent `#F6B26B` (see `docs/design-tokens.md` for full palette)

---

## 9. Routing Rules

- Routes defined in `App.tsx`
- Public routes (login, signup) wrapped with `<PublicRoute>` → redirects to home if authed
- Protected routes require auth → redirects to login if not
- **Worker-only** — no manager / admin routes

---

## 10. Build & Dev

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (port 5200) |
| `npm run build` | Production build |
| `npm run preview` | Preview built app |
| `npx tsc --noEmit` | Type check (primary quality gate — no ESLint configured) |

API proxy: `/api` → backend, configured in `vite.config.ts`.

---

# Home Page — Agent-Skill Architecture

> Applies **only** to the Home page (`pages/home/`). Other pages use the standard `Pages → lib/queries/ → lib/*.ts` flow.

### Layer responsibilities
- `Home.tsx` — UI rendering only
- `useHomeAgent` — top-level orchestrator
- `use*Agent` (`pages/home/agents/*/`) — domain decisions and workflows
- `*.skill.ts` (`pages/home/agents/*/skills/`) — pure, stateless, no side-effect dependencies on React

### Skill rules
- Skills **must not**: import React, use `useState` / `useEffect`, touch UI components
- Skills **may**: call APIs, read/write storage, perform pure calculations

### Agent rules
- UI never calls skills directly
- All domain logic flows through agents
- Each domain has exactly one unified agent

### Dependency direction
```
UI → Agent → Skill
```
No reverse dependencies allowed.

---

# Scope Guides (informal subagent hints)

When making focused changes, these are the relevant files per concern:

| Concern | Files |
|---|---|
| UI / Design System | `components/ui/` |
| Layout & Nav | `components/layout/` |
| Auth & Session | `contexts/AuthContext.tsx`, `lib/auth.ts`, `lib/storage.ts` (authStorage) |
| Attendance Domain | `lib/attendance.ts`, `lib/qr.ts`, `pages/home/agents/attendance/` |
| Location / Device | `utils/geolocation.ts`, `components/ui/LocationPermissionPopup.tsx`, `pages/home/agents/location/` |
| Storage Strategy | `lib/storage.ts` |
| API Contract | `lib/*.ts`, `lib/api-result.ts` |

---

# Rule Violation Judgment Guide

### Priority order
1. Backend truth > client convenience
2. Domain integrity > UI simplicity
3. Architecture consistency > speed

### Common violations

| Violation | Why invalid | Fix |
|---|---|---|
| Page directly calls `lib/*.ts` | Breaks layer responsibility | Use `lib/queries/` hook or create one |
| Attendance time from `Date.now()` | Device clock is mutable | Use backend timestamp |
| Storing authoritative data in `localStorage` | Storage is not trustworthy | Cache UI state only |
| Raw `localStorage.getItem(...)` | Bypasses typed wrappers | Use wrappers in `lib/storage.ts` |
| UI component contains business logic | UI must stay reusable | Lift logic to page / lib |
| Raw `<button>` / `<input>` where shared exists | Inconsistent styling | Use `components/ui/` primitives |
| Direct `fetch()` call | Bypasses auth + logging | Use `authFetch` / `loggedFetch` |
| `alert()` for user feedback | Blocks UI, no styling | Use `useToast()` |

### When unsure, ask
- Is this data authoritative? (→ backend)
- Does this logic belong to a domain? (→ `lib/` or agent)
- Would this break if offline or reloaded? (→ revisit caching)

**If unsure, defer to the stricter rule.**
