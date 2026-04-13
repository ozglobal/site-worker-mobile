# Project Structure

```
site-worker-mobile/
├── public/                         Static assets, PWA manifest, icons
├── src/
│   ├── App.tsx                     Root: routing, providers, ErrorBoundary
│   ├── main.tsx                    Entry — installs global error handlers
│   ├── index.css                   Tailwind directives + global styles
│   │
│   ├── pages/
│   │   ├── home/                   Home page — Agent-Skill architecture
│   │   │   ├── Home.tsx            UI only
│   │   │   ├── useHomeAgent.ts     Top-level orchestrator
│   │   │   ├── home.types.ts
│   │   │   ├── components/         Home-specific UI
│   │   │   └── agents/
│   │   │       ├── attendance/     Check-in/out workflows
│   │   │       │   ├── useAttendanceAgent.ts
│   │   │       │   ├── attendance.types.ts
│   │   │       │   └── skills/
│   │   │       ├── calendar/       Calendar data + compute
│   │   │       ├── location/       Geolocation + permissions
│   │   │       └── notification/   UI notifications
│   │   │
│   │   ├── login/                  Login, password reset
│   │   ├── signup/                 SMS verify, agreement, info forms
│   │   ├── profile/                Profile menu + subpages (MyInfo, MyAccount,
│   │   │                           ChangePassword, Affiliation, PayrollAccount,
│   │   │                           Engineer, Equipment, Sosok, FamilyAccount…)
│   │   ├── attendance/             History — calendar + list views
│   │   ├── contract/               Employment contract viewer
│   │   ├── onboarding/             First-time setup flow
│   │   └── qr-generator/           Dev tool for generating site QR codes
│   │
│   ├── components/
│   │   ├── ErrorBoundary.tsx       Class component wrapping App
│   │   ├── ui/                     shadcn/ui primitives + project customs
│   │   │   ├── button, input, checkbox, select, spinner…
│   │   │   ├── calendar, popover, command
│   │   │   ├── toast.tsx
│   │   │   ├── query-error-state.tsx   Retry UI for React Query failures
│   │   │   ├── QrScanner.tsx           Camera integration (exception to UI-only)
│   │   │   ├── LocationPermissionPopup.tsx
│   │   │   ├── MonthSelector.tsx, SiteCombobox.tsx
│   │   │   └── ...
│   │   ├── layout/                 AppHeader, AppTopBar, AppBottomNav
│   │   ├── calendar/               Calendar UI blocks
│   │   └── home/                   Home-specific layout pieces
│   │
│   ├── lib/                        Business + API layer
│   │   ├── auth.ts                 Login, token refresh, authFetch, loggedFetch
│   │   ├── attendance.ts           Attendance API
│   │   ├── profile.ts              Profile API
│   │   ├── contract.ts             Contract API + domain logic
│   │   ├── notice.ts               Notification inbox API
│   │   ├── upload.ts               File upload (uses authFetch)
│   │   ├── juso.ts                 Korean address lookup (public API)
│   │   ├── qr.ts                   QR parsing
│   │   ├── s3.ts                   S3 presigned URL handling
│   │   ├── storage.ts              localStorage / sessionStorage / IndexedDB wrappers
│   │   ├── api-result.ts           ApiResult<T> type + safeJson()
│   │   ├── errorReporter.ts        Client error queue + dedup + batch flush
│   │   ├── globalErrorHandlers.ts  window.error + unhandledrejection hooks
│   │   ├── config.ts               API_BASE_URL, X_TENANT_ID
│   │   ├── utils.ts                shadcn cn() helper
│   │   └── queries/                React Query hooks
│   │       ├── useWorkerProfile.ts
│   │       ├── useWorkerDocuments.ts
│   │       ├── useDailyAttendance.ts
│   │       ├── useMonthlyAttendance.ts
│   │       ├── useContracts.ts
│   │       ├── useChangePassword.ts
│   │       ├── useActivePartners.ts
│   │       └── useNotices.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx         Auth state (login/logout/token lifecycle)
│   │   └── ToastContext.tsx        Global toast notifications
│   │
│   ├── utils/                      Pure functions (no side effects)
│   │   ├── time.ts                 KST time formatting
│   │   ├── format.ts               Number / currency formatting
│   │   ├── attendance.ts           Attendance display helpers
│   │   ├── geolocation.ts          Browser geolocation wrapper
│   │   └── devLog.ts               DEV-only console helpers + devLogApiPair
│   │
│   ├── types/                      Shared TS types
│   ├── hooks/                      Shared custom hooks
│   │   └── useHoneypot.ts          Bot protection for forms
│   │
│   ├── i18n/                       Internationalization (ko, en)
│   │   ├── i18n.ts
│   │   ├── en/
│   │   └── ko/
│   │
│   ├── assets/                     Static images
│   └── icons/                      Icon files
│
├── docs/                           Project documentation (this directory)
├── CLAUDE.md                       Architecture rules & conventions
├── login-flow.md                   Auth sequence diagrams
├── tailwind.config.md              Color / component usage guide
├── package.json                    npm dependencies
├── vite.config.ts                  Vite + PWA + /api proxy
├── tsconfig.json
├── tailwind.config.cjs             Theme tokens
├── postcss.config.cjs
├── components.json                 shadcn/ui config
└── index.html
```

---

## Architecture patterns

### Home page — Agent-Skill layering

```
Home.tsx  →  useHomeAgent  →  use*Agent (domain)  →  *.skill.ts (pure)
 (UI)        (orchestrator)   (decisions)            (logic)
```

- **Skills** — pure, stateless. No React, no hooks, no UI.
- **Agents** — hooks composing skills and managing domain state.
- **UI** — reads from agents only. Never calls skills directly.

Dependency direction: `UI → Agent → Skill`. No reverse deps.

### All other pages — standard pattern

```
Page.tsx  →  lib/queries/use*.ts  →  lib/*.ts  →  authFetch / loggedFetch
 (UI)        (React Query hooks)     (API fn)     (auto-logged fetch)
```

### `lib/queries/` vs `lib/*.ts` — a distinction worth keeping

- `lib/*.ts` — raw API call functions returning `ApiResult<T>` (e.g. `fetchMonthlyAttendance`, `changePassword`).
- `lib/queries/*.ts` — React Query hooks wrapping those functions with caching, loading states, retry, and error exposure.
- **Pages consume `lib/queries/` hooks — never raw `lib/*.ts` functions.**
