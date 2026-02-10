# Site Worker Mobile App — Project Structure

```
site-worker-mobile/
├── public/                         # Static assets, PWA manifest, icons
├── src/
│   ├── App.tsx                     # Root component, routing, providers
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles (Tailwind directives)
│   │
│   ├── pages/                      # Page-level components (orchestration layer)
│   │   ├── home/                   # Home page (Agent-Skill architecture)
│   │   │   ├── Home.tsx            # UI rendering only
│   │   │   ├── useHomeAgent.ts     # Master orchestrator hook
│   │   │   ├── home.types.ts       # Page-level types
│   │   │   ├── components/         # Home-specific UI components
│   │   │   └── agents/             # Domain agents
│   │   │       ├── attendance/     # Check-in/out workflows
│   │   │       │   ├── useAttendanceAgent.ts
│   │   │       │   ├── attendance.types.ts
│   │   │       │   └── skills/     # Pure business logic
│   │   │       │       ├── attendance-api.skill.ts
│   │   │       │       └── attendance-state.skill.ts
│   │   │       ├── calendar/       # Calendar data + computation
│   │   │       │   ├── useCalendarAgent.ts
│   │   │       │   └── skills/
│   │   │       │       ├── calendar-api.skill.ts
│   │   │       │       └── calendar-compute.skill.ts
│   │   │       ├── location/       # Geolocation + permissions
│   │   │       │   ├── useLocationAgent.ts
│   │   │       │   └── skills/
│   │   │       │       ├── geolocation.skill.ts
│   │   │       │       └── permission.skill.ts
│   │   │       └── notification/   # UI notifications
│   │   │           ├── useNotificationAgent.ts
│   │   │           └── skills/
│   │   │               └── notification.skill.ts
│   │   │
│   │   ├── login/                  # Login, password reset
│   │   ├── signup/                 # SMS verification, agreement, info forms
│   │   ├── profile/               # Worker profile management
│   │   │   ├── Profile.tsx         # Profile menu
│   │   │   ├── MyInfo.tsx          # Personal info edit
│   │   │   ├── MyAccount.tsx       # Account info
│   │   │   ├── ChangePassword.tsx  # Password change
│   │   │   ├── Affiliation.tsx     # Company affiliation
│   │   │   ├── PayrollAccount.tsx  # Bank account info
│   │   │   └── ...                 # Engineer, Equipment, Sosok, etc.
│   │   ├── attendance/             # Attendance history (calendar + list views)
│   │   ├── contract/               # Employment contract viewing
│   │   ├── onboarding/             # First-time user setup
│   │   └── qr-generator/          # QR code generation (dev tool)
│   │
│   ├── components/                 # Shared UI components (no business logic)
│   │   ├── ErrorBoundary.tsx       # React error boundary (wraps App)
│   │   ├── ui/                     # shadcn/ui primitives + custom components
│   │   │   ├── button.tsx, input.tsx, checkbox.tsx
│   │   │   ├── calendar.tsx, popover.tsx, command.tsx
│   │   │   ├── toast.tsx           # Toast notification component
│   │   │   ├── query-error-state.tsx # React Query error + retry component
│   │   │   ├── QrScanner.tsx       # QR scanner UI
│   │   │   ├── LocationPermissionPopup.tsx
│   │   │   ├── MonthSelector.tsx, SiteCombobox.tsx
│   │   │   └── ...
│   │   ├── layout/                 # App shell components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppTopBar.tsx
│   │   │   └── AppBottomNav.tsx
│   │   ├── calendar/               # Calendar UI components
│   │   └── home/                   # Home-specific layout components
│   │
│   ├── lib/                        # Business logic & API layer
│   │   ├── auth.ts                 # Authentication (login, token refresh)
│   │   ├── attendance.ts           # Attendance API calls
│   │   ├── profile.ts             # Profile API calls
│   │   ├── contract.ts            # Contract domain logic + API
│   │   ├── qr.ts                  # QR code parsing logic
│   │   ├── s3.ts                  # S3 presigned URL handling
│   │   ├── upload.ts              # File upload logic
│   │   ├── api-result.ts         # ApiResult<T> type + safeJson() helper
│   │   ├── errorReporter.ts      # Client error collection, dedup, batch flush
│   │   ├── globalErrorHandlers.ts # Unhandled error/rejection handlers
│   │   ├── config.ts             # API base URL, tenant ID
│   │   ├── storage.ts            # localStorage/sessionStorage/IndexedDB wrappers
│   │   ├── utils.ts              # shadcn/ui cn() utility
│   │   └── queries/              # React Query hooks
│   │       ├── useWorkerProfile.ts
│   │       ├── useDailyAttendance.ts
│   │       ├── useMonthlyAttendance.ts
│   │       ├── useContracts.ts
│   │       └── useChangePassword.ts
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # Auth state (login/logout/token lifecycle)
│   │   └── ToastContext.tsx       # Global toast notifications
│   │
│   ├── utils/                     # Pure utility functions (no side effects)
│   │   ├── time.ts               # KST time formatting
│   │   ├── format.ts             # Number/currency formatting
│   │   ├── attendance.ts         # Attendance display helpers
│   │   ├── geolocation.ts        # Geolocation helpers
│   │   └── devLog.ts             # Development logging
│   │
│   ├── types/                     # Shared TypeScript type definitions
│   ├── hooks/                     # Shared custom hooks
│   │   └── useHoneypot.ts        # Bot protection for forms
│   │
│   ├── i18n/                      # Internationalization
│   │   ├── i18n.ts               # i18next configuration
│   │   ├── en/                   # English translations (JSON)
│   │   └── ko/                   # Korean translations (JSON)
│   │
│   ├── assets/                    # Static assets (images)
│   └── icons/                     # Icon files
│
├── docs/                          # Project documentation
├── CLAUDE.md                      # Architecture rules & development conventions
├── package.json                   # Dependencies (npm)
├── package-lock.json
├── vite.config.ts                 # Vite + PWA + API proxy configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.cjs            # Tailwind CSS theme configuration
├── postcss.config.cjs             # PostCSS configuration
├── components.json                # shadcn/ui configuration
└── index.html                     # HTML entry point
```

---

## Architecture Patterns

### Home Page: Agent-Skill Pattern

The home page follows a strict layered architecture:

```
Home.tsx (UI)  →  useHomeAgent (orchestrator)  →  use*Agent (domain agents)  →  *.skill.ts (pure logic)
```

- **Skills** are pure, stateless functions — no React, no hooks, no UI
- **Agents** are hooks that compose skills and manage domain state
- **UI** only reads from agents — never calls skills directly

### Other Pages: Standard Pattern

Pages outside `home/` use a simpler pattern:

```
Page.tsx  →  lib/queries/use*.ts (React Query hooks)  →  lib/*.ts (API functions)
```

### Key Distinction: lib/queries/ vs lib/*.ts

- `lib/*.ts` — Raw API call functions (e.g., `fetchMonthlyAttendance`, `changePassword`)
- `lib/queries/*.ts` — React Query hooks that wrap those functions with caching, loading states, and error handling
- Pages should use `lib/queries/` hooks, not raw `lib/*.ts` functions directly
