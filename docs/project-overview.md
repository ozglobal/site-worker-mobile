# Site Worker Mobile App — Overview

## What this app is

**C-Worker** is a mobile-first Progressive Web App (PWA) for construction site workers. It is one frontend of a multi-tenant workforce management service subscribed to by construction companies.

Each subscriber company manages its own workers within the service — worker profiles, attendance records, and data required for payroll calculation. Tenant separation (data and user access scoped to the subscribing company) is enforced by the backend.

This repository contains the **Site Worker Mobile App frontend only**. Role-specific apps for site manager, service admin, and corporate manager live in separate projects.

---

## Target users

- Construction site workers
- Users primarily on mobile devices, on-site
- Korean-speaking users (with multi-language support via i18n)

---

## Feature scope

| Feature | Description |
|---|---|
| Authentication | Login, signup, SMS verification (NICE API), password setup/reset/change |
| Attendance | Check-in / out via QR scan + GPS location evidence |
| Calendar | Weekly and monthly attendance history |
| Profile | Personal info, affiliation, engineer / equipment, payroll account |
| Contracts | Employment contract viewing (S3-hosted documents) |
| Onboarding | First-time user setup flow |

---

## Project scope — frontend-only

- **Frontend (this project):** UI rendering, client routing, state management, API integration
- **Backend (external):** Tenant isolation, authentication, authorization, business logic, database

API requests are proxied via `/api` to the backend server (configured in `vite.config.ts`). The tenant context is sent via the `X-Tenant-Id` header (configured in `lib/config.ts`).

---

## Multi-tenant context

- Each construction company is a separate tenant (subscriber)
- Workers belong to exactly one subscriber company
- Users access and manage data **only within their authorized scope**
- Tenant isolation, authentication, and authorization are enforced by the backend
- The frontend assumes valid tenant and role context is provided via backend APIs
- No cross-tenant data access is possible beyond backend-enforced permissions

---

## PWA capabilities & constraints

- Mobile-first PWA — not a native application
- Installable on mobile devices without app stores
- Offline and poor-network tolerance via service workers (Workbox)
- Portrait orientation, standalone display mode
- Device features (geolocation, camera for QR) depend on browser / OS support
- Must handle unsupported PWA features gracefully
- No native mobile SDKs or platform-specific code

---

## Internationalization (i18n)

- `react-i18next` for translation
- Supported languages: Korean (`ko`), English (`en`)
- All user-facing text must flow through i18n — no hardcoded copy
- Translation files: JSON in `src/i18n/`
- Browser language auto-detection via `i18next-browser-languagedetector`

---

## Routing constraints

- Routes are limited to worker-specific features (profile, attendance, contracts)
- No management or administrative routes
- Authentication and tenant context resolve before protected routes

---

## Non-goals / out of scope

- Backend API implementation
- Database design or data persistence
- Authentication and authorization logic
- Payroll calculation logic beyond data presentation
- Cross-tenant data access beyond backend-enforced permissions
- Native mobile applications

This project focuses exclusively on frontend implementation and behavior.

---

## AI & development assumptions

- Treat backend behavior as an external dependency
- API contracts are assumed stable and provided externally
- When generating or modifying code, prefer consistency with existing patterns — see [CLAUDE.md](../CLAUDE.md)
