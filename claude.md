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

* components/

  * Pure UI and layout
  * No business rules

* lib/

  * API calls
  * Domain logic
  * Storage access

* utils/

  * Pure functions only
  * No side effects

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

---

## 5. UI Rules

* Use shadcn/ui as the base
* Touch-friendly spacing (min 44px)
* No inline styles inside pages
* Consistent typography and color usage

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
* lib/storage.ts

**Responsibilities**

* Login / logout flow
* Token lifecycle
* Session recovery UX

---

## Attendance Domain Subagent

**Scope**

* lib/attendance.ts
* types/qr.ts

**Responsibilities**

* Check-in / out logic
* QR + location orchestration

---

## Location & Device Capability Subagent

**Scope**

* utils/geolocation.ts
* LocationPermissionPopup.tsx

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

# Rule Violation Judgment Guide

## 판단 우선순위

1. Backend truth vs client convenience
2. Domain integrity over UI simplicity
3. Architecture consistency over speed

---

## Common Violation Examples

### ❌ Page directly calls API

* Why invalid: Breaks layer responsibility
* Fix: Move logic into lib/ and expose function

---

### ❌ Attendance time taken from client clock

* Why invalid: Device clock is mutable
* Fix: Always use backend timestamp

---

### ❌ Storing authoritative data in localStorage

* Why invalid: Storage is not trustworthy
* Fix: Cache UI state only

---

### ❌ UI component contains business logic

* Why invalid: UI must remain reusable
* Fix: Lift logic into page or lib layer

---

## When Unsure

Ask:

* Is this data authoritative?
* Does this logic belong to a domain?
* Would this break if offline or reloaded?

If unsure, defer to the stricter rule.


## Home Page Agent Architecture Rules

### 1. Layer Responsibilities
- Home.tsx: UI rendering only
- useHomeAgent: orchestration only
- use*Agent: domain decisions and workflows
- *.skill.ts: pure, stateless, side-effect isolated

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
