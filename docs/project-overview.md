# Site Worker Mobile App — Project Overview

## What This App Is

**C-Worker** is a mobile-first Progressive Web Application (PWA) for construction site workers. It is part of a multi-tenant workforce management service subscribed to by construction companies.

Each subscriber company manages its own workers within the service, including worker profiles, attendance records, and data required for payroll calculation. The service enforces company-level separation, ensuring that data and user access are scoped to the subscribing construction company.

This repository contains the frontend for the **Site Worker Mobile App** only. All other role-specific apps (site manager, service admin, corporate manager) are separate projects.

---

## Target Users

- Construction site workers
- Users primarily using mobile devices on-site
- Korean-speaking users with multi-language support via i18n

---

## Feature Scope

| Feature | Description |
|---------|-------------|
| Authentication | Login, signup, SMS verification (NICE API), password setup/reset/change |
| Attendance | Check-in/out via QR scan + GPS location evidence |
| Calendar | Weekly and monthly attendance history views |
| Profile | Personal info, affiliation, engineer/equipment, payroll account |
| Contracts | Employment contract viewing (S3-hosted documents) |
| Onboarding | First-time user setup flow |

---

## Project Scope (Frontend-Only)

This project is **frontend-only**. The backend is an external dependency.

- **Frontend (this project):** UI rendering, client-side routing, state management, API integration
- **Backend (external):** Tenant isolation, authentication, authorization, business logic, database

API requests are proxied via `/api` to the backend server (configured in `vite.config.ts`). The tenant context is sent via `X_TENANT_ID` header (configured in `lib/config.ts`).

---

## Multi-Tenant Context

- Each construction company is treated as a separate tenant (subscriber)
- Workers belong to exactly one subscriber company
- Users can access and manage data **only within their authorized scope**
- Tenant isolation, authentication, and authorization are enforced by the backend
- The frontend assumes valid tenant and role context is provided via backend APIs
- No cross-tenant data access is possible beyond backend-enforced permissions

---

## PWA Capabilities & Constraints

- The app is a mobile-first PWA, not a native application
- Installable on mobile devices without app stores
- Offline and poor-network tolerance via service workers (Workbox)
- Portrait orientation, standalone display mode
- Device features (geolocation, camera for QR) depend on browser/OS support
- The frontend must handle unsupported PWA features gracefully
- No native mobile SDKs or platform-specific code are included

---

## Internationalization (i18n)

- Multi-language support via `react-i18next`
- Supported languages: Korean (ko), English (en)
- All user-facing text must use the i18n system
- Translation files are JSON-based, located in `src/i18n/`
- Browser language auto-detection via `i18next-browser-languagedetector`

---

## Routing Constraints

- Routes are limited to worker-specific features (profile, attendance, contracts)
- No management or administrative routes are allowed
- Authentication and tenant context are resolved before accessing protected routes

---

## Non-Goals / Out of Scope

- Backend API implementation
- Database design or data persistence
- Authentication and authorization logic
- Payroll calculation logic beyond data presentation
- Cross-tenant data access beyond backend-enforced permissions
- Native mobile applications

This project focuses exclusively on frontend implementation and behavior.

---

## AI & Development Assumptions

- The project is frontend-only; backend behavior must be treated as an external dependency
- API contracts are assumed to be stable and provided externally
- When generating or modifying code, prefer consistency with existing patterns and conventions

