# Site Worker Mobile App — Tech Stack

## Overview

This document describes the technology stack for the **Site Worker Mobile App (C-Worker)**, a mobile-first PWA for construction site worker attendance management.

All backend systems (API, authentication, authorization, database, business logic) are treated as **external dependencies**.

---

## Platform: PWA

The app uses **PWA technology** to deliver a web-based mobile experience.

### Rationale

- Single frontend technology stack
- Installable on mobile devices without app stores
- Offline and poor-network tolerance
- Easier deployment and updates
- Suitable for construction site environments

---

## Core Technologies

### TypeScript (5.2+)

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`)
- Path alias: `@/` maps to `src/`

### React (18.3)

- Core UI framework
- Function components with hooks only

### Vite (5.4)

- Fast local development (port 5200)
- Optimized production builds
- API proxy: `/api` → backend server

### PWA Support (vite-plugin-pwa 1.2)

- Auto-updating service worker via Workbox
- Web app manifest (`public/manifest.json`)
- Standalone display mode, portrait orientation

---

## State Management

### Server State — React Query (@tanstack/react-query 5.90)

- Query hooks in `lib/queries/` for data fetching and caching
- `staleTime: Infinity` for data that rarely changes (monthly attendance)
- `invalidateQueries` after mutations to refresh from backend
- `QueryClientProvider` in `App.tsx`

### Auth State — React Context

- `AuthContext.tsx` manages login/logout/token refresh
- Access token held in-memory (`lib/auth.ts`), refresh token in localStorage

### UI State — useState / useReducer

- Local component state for form inputs, UI toggles
- Agent hooks (`useAttendanceAgent`, `useCalendarAgent`, etc.) manage domain-specific state

---

## Routing

### React Router DOM (7.11)

- Client-side routing defined in `App.tsx`
- Routes limited to worker-specific features
- Auth guards resolve before protected routes

---

## Styling & UI

### Tailwind CSS (3.4)

- Utility-first styling
- Custom brand colors: primary (`#007DCA`), secondary (`#33D4C1`), accent (`#F6B26B`)
- Semantic colors: success, warning, error
- Animation utilities via `tailwindcss-animate`

### shadcn/ui (Radix UI)

- Accessible component primitives: checkbox, popover, slot
- Class Variance Authority (0.7) for component variants
- `clsx` + `tailwind-merge` for class name composition
- Combobox via `cmdk`

### Icons

- **Lucide React** (0.563) — primary icon set
- **Tabler Icons React** (3.36) — supplementary icons
- **MUI Icons Material** (7.3) — additional icons

### Font

- **Pretendard** (`@fontsource/pretendard`) — Korean-optimized font family

---

## Internationalization

### react-i18next (16.5)

- i18next (25.7) core
- Browser language auto-detection (`i18next-browser-languagedetector`)
- HTTP backend for translation loading (`i18next-http-backend`)
- Languages: Korean (ko), English (en)
- Translation files: `src/i18n/ko/`, `src/i18n/en/`

---

## Key Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `@zxing/browser` | 0.1.5 | QR code scanning (camera) |
| `qrcode.react` | 4.2.0 | QR code generation |
| `date-fns` | 4.1.0 | Date manipulation |
| `react-day-picker` | 9.13.0 | Calendar/date picker component |
| `@emotion/react` + `@emotion/styled` | 11.14 | CSS-in-JS (used by MUI) |

---

## Package Management

- **npm** with `package-lock.json`
- Scripts:
  - `npm run dev` — Vite dev server
  - `npm run build` — production build
  - `npm run preview` — preview built app

---

## Development Tooling

### TypeScript Strict Mode

- Primary code quality check
- `noUnusedLocals` and `noUnusedParameters` enforced

### Linting & Formatting

- Not yet configured (no ESLint/Prettier config files)
- TypeScript compiler serves as the primary check

### Testing

- Not yet configured (no test framework installed)
- Known gap for future improvement

---

## Accessibility (Goals)

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Mobile accessibility: touch-friendly controls (min 44px)

---

## Performance Guidelines

- Route-level code splitting
- Lazy loading for heavy components
- Optimized assets
- Web Vitals monitoring

---

## Error Handling & Reporting

### Unified Error Type — `ApiResult<T>`

- All `lib/` API functions return discriminated union: `{ success: true; data: T } | { success: false; error: string }`
- JSON parsing via `safeJson()` — catches malformed responses without throwing
- Defined in `lib/api-result.ts`

### Error Boundary

- React class component (`ErrorBoundary`) wraps the app in `App.tsx`
- Catches render crashes, shows fallback UI with retry

### Toast Notifications

- `ToastContext` + `useToast()` hook for success/error/info messages
- Auto-dismiss after 3 seconds
- Used in place of `alert()` across the app

### Client Error Reporter

- `lib/errorReporter.ts` — in-memory queue, dedup (60s window), batch flush (10s interval)
- `lib/globalErrorHandlers.ts` — catches `window.error` and `unhandledrejection`
- 22 error sites report via `reportError(code, message, extra?)`
- Endpoint placeholder in `main.tsx` — active once backend provides URL
- No PII in payloads — only `workerId` for correlation

### React Query Error States

- `QueryErrorState` component for data fetch failures
- Shows error message + retry button calling `refetch()`

---

## Security (Frontend)

- No hard-coded secrets
- Environment-based configuration via Vite proxy
- HTTPS-only API communication
- Client-side input sanitization
- Honeypot-based bot detection on forms

> Authentication and authorization enforcement are handled by the backend.

---

## Non-Goals

This document does not define:

- Backend technologies
- Database systems
- Authentication or authorization logic
- Native mobile applications
- Payroll calculation logic
