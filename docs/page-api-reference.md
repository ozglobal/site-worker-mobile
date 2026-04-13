# Page / Route / Button / API Reference

## Background / Auto-fired API calls

These fire without a user clicking a button. Mostly React Query hooks that run on page mount, plus app bootstrap and polling.

### On mount (useQuery)

| Hook | Endpoint | Pages |
|------|----------|-------|
| `useWorkerProfile` | `GET /system/worker/me` | Profile, MyInfo |
| `useMonthlyAttendance(year, month)` | `GET /system/attendance/my/{year}/{month}` | Home, Calendar, List |
| `useContracts(year)` | `GET /efs/api/documents?bizType=worker_contract&year={year}` | Contract |
| `useActivePartners` | `GET /system/partner/active` | Profile subpages |
| `useWorkerDocuments` | `GET /system/worker/me/document` | Onboarding / Documents |
| `useNotices` | `GET /notices/inbox?recipientType=worker...` | Notification panel (any page) |

### Polling

| Hook | Interval | Endpoint |
|------|----------|----------|
| `useNotices` | 5 min + refetch on window focus | `GET /notices/inbox` |

### App bootstrap / auth

| Trigger | Endpoint |
|---------|----------|
| App reload (AuthContext restore) | `POST /auth/refresh` then `GET /auth/user/info` |
| Proactive token refresh (before expiry) | `POST /auth/refresh` |
| 401 retry inside `authFetch` | `POST /auth/refresh` |

### Selector / dependency changes

Changing these controls triggers an automatic refetch of the underlying query (not a button click):

- Year/month selector on Attendance List → `useMonthlyAttendance` refetches
- Year dropdown on Contract page → `useContracts` refetches

## Routes

| Route | Page | Layout | Auth |
|-------|------|--------|------|
| `/login` | LoginPage | Standalone | Public |
| `/login/sms-verification` | SmsVerificationPage | Standalone | Public |
| `/login/set-password` | LoginSetPasswordPage | Standalone | Public |
| `/signup` | SignUpPage | Standalone | Public |
| `/signup/nice-api` | NiceApiPage | Standalone | Public |
| `/signup/sms-verification` | SignupSmsVerificationPage | Standalone | Public |
| `/signup/agreement` | AgreementPage | Standalone | Public |
| `/signup/domestic-foreign` | DomesticForeignPage | Standalone | Public |
| `/signup/domestic-info` | DomesticInfoPage | Standalone | Public |
| `/signup/foreign-info` | ForeignInfoPage | Standalone | Public |
| `/signup/passport-info` | PassportInfoPage | Standalone | Public |
| `/signup/set-password` | SetPasswordPage | Standalone | Public |
| `/signup/step3` | SignUpStep3Page | Standalone | Public |
| `/signup/complete` | SignUpCompletePage | Standalone | Public |
| `/home` | Home | BottomNav | Protected |
| `/attendance` | CalendarPage | BottomNav | Protected |
| `/attendance/list` | ListPage | BottomNav | Protected |
| `/attendance/detail/:date` | DailyDetailPage | BottomNav | Protected |
| `/contract` | ContractPage | BottomNav | Protected |
| `/profile` | MyInfoPage (Profile) | BottomNav | Protected |
| `/profile/worker-type` | WorkerTypePage | BottomNav | Protected |
| `/profile/myinfo` | MyInfoPage (Detail) | BottomNav | Protected |
| `/profile/my-account` | MyAccountPage | BottomNav | Protected |
| `/profile/family-account` | FamilyAccountPage | BottomNav | Protected |
| `/profile/outsourcing` | OutsourcingPage | BottomNav | Protected |
| `/profile/engineer` | EngineerPage | BottomNav | Protected |
| `/profile/equipments` | EquipmentPage | BottomNav | Protected |
| `/profile/payroll-account` | PayrollAccountPage | BottomNav | Protected |
| `/change-password` | ChangePasswordPage | BottomNav | Protected |
| `/onboarding` | OnboardingPage | Standalone | Protected |
| `/onboarding/worker-type` | WorkerTypePage (mode=onboarding) | Standalone | Protected |
| `/onboarding/my-account` | MyAccountPage (mode=onboarding) | Standalone | Protected |
| `/onboarding/outsourcing` | OnboardingOutsourcingPage | Standalone | Protected |
| `/onboarding/engineer` | OnboardingEngineerPage | Standalone | Protected |
| `/onboarding/family-account` | FamilyAccountPage (mode=onboarding) | Standalone | Protected |
| `/onboarding/documents` | OnboardingDocumentsPage | Standalone | Protected |
| `/onboarding/company-account` | OnboardingCompanyAccountPage | Standalone | Protected |
| `/onboarding/outsourcing-documents` | OnboardingOutsourcingDocumentsPage | Standalone | Protected |
| `/onboarding/equipments` | OnboardingEquipmentPage | Standalone | Protected |
| `/onboarding/equipments-list` | OnboardingEquipmentListPage | Standalone | Protected |
| `/onboarding/payroll-account` | PayrollAccountPage (mode=onboarding) | Standalone | Protected |
| `/onboarding/documents/capture-guide-idcard` | OnboardingDocumentCaptureGuideIdcardPage | Standalone | Protected |
| `/onboarding/documents/capture-guide-passport` | OnboardingDocumentCaptureGuidePassportPage | Standalone | Protected |
| `/onboarding/documents/id-card-preview` | OnboardingIdCardPreviewFrPage | Standalone | Protected |
| `/onboarding/documents/id-card-preview-kr` | OnboardingIdCardPreviewKrPage | Standalone | Protected |
| `/onboarding/documents/passport-preview` | OnboardingPassportPreviewPage | Standalone | Protected |

## Login Page (`/login`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Phone Input | — | Enter phone | — |
| Password Input | IconEye / IconEyeClosed | Toggle visibility | — |
| Auto Login | Checkbox | Enable auto-login storage | — |
| Submit | 로그인 (primary) | Submit login | `POST /auth/login` |
| Helper Links | 회원 가입 | Navigate to signup | — |
| | 비밀번호 재설정 | Navigate to password reset | — |
| PWA Install | 앱 설치하기 (outline) | Install PWA | — |

## Login SMS Verification (`/login/sms-verification`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Phone Input | 인증번호 받기 | Send password reset code | `POST /auth/password/send-code` |
| Verification | — | Enter code (6 digits) | — |
| Submit | 다음 | Navigate to set-password | — |

## Login Set Password (`/login/set-password`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| New Password | Input | Password with rules (8-64 chars, a/0/symbol) | — |
| Confirm Password | Input | Confirm password | — |
| Submit | 저장 (primary) | Reset password by SMS | `PATCH /auth/password/reset-by-sms` |

## Signup Page (`/signup`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Card 1 | 내 명의 휴대폰이 있어요 | Navigate to NICE API page | — |
| Card 2 | 타인 명의 휴대폰이 있어요 | Navigate to SMS verification | — |

## Signup SMS Verification (`/signup/sms-verification`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Phone Input | 인증번호 받기 | Send signup code | `POST /auth/register/send-code` |
| Verification | — | Enter code (6 digits) | — |
| Submit | 다음 | Navigate to domestic-foreign | — |

## Signup Agreement (`/signup/agreement`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Content | — | Display agreement terms | — |
| Submit | 동의하기 | Store consent & navigate | — |

## Signup Domestic/Foreign (`/signup/domestic-foreign`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Card 1 | 대한민국 (이름과 주민등록번호) | Select domestic path | — |
| Card 2 | 외국인 (이름과 여권번호) | Select foreign path | — |

## Signup Domestic Info (`/signup/domestic-info`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Name | Input (readonly) | Auto-filled from NICE/previous | — |
| SSN | Input (readonly) | Auto-filled from NICE/previous | — |
| Phone | Input (readonly) | Retrieved from storage | — |
| Address | Input | Manual entry | — |
| Submit | 저장 | Store and navigate | — |

## Signup Set Password (`/signup/set-password`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| New Password | Input | Password with rules (8-64 chars, a/0/symbol) | — |
| Confirm Password | Input | Confirm password | — |
| Submit | 회원가입 (primary) | Register worker account | `POST /auth/register/worker` |

## Signup Complete (`/signup/complete`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Success Message | — | Display completion | — |
| Button | 확인 | Navigate to login | — |

## Home Page (`/home`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Header | — | Display company name | — |
| Alerts | 필수 정보 입력 (AlertBanner) | Navigate to /profile | — |
| | 미서명 계약서 (AlertBanner) | Navigate to /contract | — |
| Check-in Card | 출근하기 (primary) | Submit check-in | `POST /system/attendance/check-in` |
| | 야근 신청 (outline) | Open overtime dialog | — |
| | 퇴근하기 (primary) | Open checkout confirmation | — |
| Overtime Dialog | 신청하기 | Submit overtime state | `POST /system/attendance/check-out` |
| Checkout Dialog | 퇴근하기 (primary) | Submit check-out | `POST /system/attendance/check-out` |
| Daily Records | [TEST] 출퇴근 기록 삭제 | Delete attendance record | `DELETE /system/attendance/{id}` |
| | 정정 요청 (Correction) | Open correction dialog | — |
| Correction Dialog | 신청하기 | Submit corrections (2 requests) | `POST /system/attendance/{id}/correction-request` (×2) |
| Bottom Nav | 근태, 근로계약, 내정보 | Navigation | — |

## Attendance Calendar (`/attendance`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Month Nav | Previous/Next Month | Change month | — |
| View Mode | Toggle Calendar/List | Switch view | — |
| Site Filter | Site Combobox | Filter by site | — |
| Calendar | Click date | Navigate to detail | — |

## Attendance List (`/attendance/list`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Month Nav | Previous/Next Month | Change month | — |
| View Mode | Toggle Calendar/List | Switch view | — |
| Site Filter | Site Combobox | Filter by site | — |
| Record Cards | Click date | Navigate to detail | — |
| | 정정 요청 (button) | Open correction dialog | — |
| Correction Dialog | 신청하기 | Submit corrections (2 requests) | `POST /system/attendance/{id}/correction-request` (×2) |

## Attendance Daily Detail (`/attendance/detail/:date`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Date Nav | Previous/Next Day | Navigate days | — |
| Record Cards | 정정 요청 (button) | Open correction dialog | — |
| Correction Dialog | 신청하기 | Submit corrections (2 requests) | `POST /system/attendance/{id}/correction-request` (×2) |

## Contract Page (`/contract`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Alert | — | Unsigned contract warning | — |
| Year Selector | Year Dropdown | Change year | `GET /efs/api/documents?bizType=worker_contract&year={year}` |
| Contract List | View PDF | Open document PDF | `GET /efs/api/documents/{id}/pdf` |
| | 서명하기 | Open signing link | `GET /efs/api/signing-link?documentId={id}` |
| | Status Badge | Display status | — |

## Profile / My Info (`/profile`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Menu Items | Worker Type | Navigate to worker-type | — |
| | My Info | Navigate to myinfo | — |
| | My Account | Navigate to my-account | — |
| | Family Account | Navigate to family-account | — |
| | Outsourcing | Navigate to outsourcing | — |
| | Engineer | Navigate to engineer | — |
| | Equipment | Navigate to equipments | — |
| | Change Password | Navigate to change-password | — |
| | Logout | Clear auth & navigate to login | — |

## Profile My Info Detail (`/profile/myinfo`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Name | Input (readonly) | Verify identity dialog | — |
| SSN | Input (readonly) | Verify identity dialog | — |
| Phone | Input (readonly) | Verify identity dialog | — |
| Address | Input | Edit field | — |
| Worker Type | Dropdown | Select type (general/service/specialty/equipment) | — |
| Verify Dialog | 본인인증 | Navigate to NICE API | — |
| | 닫기 | Close dialog | — |
| Submit | 저장 (primary) | Update profile | `PATCH /system/worker/{id}/address` |

## Profile My Account (`/profile/my-account`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Account Fields | — | Manage bank account info | — |
| Submit | 저장 (primary) | Update account | `PATCH /system/worker/{id}/account` |

## Profile Family Account (`/profile/family-account`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Family Account | — | Manage family account | — |
| Submit | 저장 (primary) | Update family account | `PATCH /system/worker/{id}/family-account` |

## Profile Outsourcing (`/profile/outsourcing`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Outsourcing Info | — | Display outsourcing details | — |

## Profile Engineer (`/profile/engineer`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Engineer Info | — | Display engineer details | — |

## Profile Equipment (`/profile/equipments`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Equipment List | — | Display equipment items | — |

## Profile Payroll Account (`/profile/payroll-account`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Payroll Account | — | Manage payroll account | — |
| Submit | 저장 (primary) | Update payroll account | — |

## Profile Change Password (`/change-password`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Current Password | Input | Enter current password | — |
| New Password | Input | Enter new password (8-64, a/0/symbol) | — |
| Confirm Password | Input | Confirm new password | — |
| Submit | 저장 (primary) | Submit password change | `PATCH /user/profile/password` |

## Onboarding (`/onboarding`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Message | — | Welcome greeting | — |
| Register Later | 나중에 등록하기 | Navigate to home | — |
| Register Now | 지금 등록하기 | Navigate to worker-type | — |

## Onboarding Worker Type (`/onboarding/worker-type`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Worker Type Cards | Select type | Navigate to next onboarding step | — |

## Onboarding My Account (`/onboarding/my-account`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| Account Fields | — | Enter bank account | — |
| Submit | 다음 (primary) | Continue onboarding | — |

## Onboarding Documents (`/onboarding/documents`)

| Section | Button/Icon | Action | API |
|---------|-------------|--------|-----|
| ID Card Upload | 추가하기 | Open ID card dialog | — |
| Passport Upload | 추가하기 | Open passport dialog | — |
| ID Card Dialog | Select type | Choose ID/Passport | — |
| ID Card Camera | Capture | Take photo | — |
| ID Card Preview | 저장 | Upload document | `POST /system/worker/documents/upload` |
| Submit | 다음 (primary) | Continue onboarding | — |

---

## API Summary

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/auth/login` | POST | Login page |
| `/auth/password/send-code` | POST | Password reset SMS |
| `/auth/password/reset-by-sms` | PATCH | Reset password |
| `/auth/register/send-code` | POST | Signup SMS verification |
| `/auth/register/worker` | POST | Signup completion |
| `/auth/refresh` | POST | AuthContext (auto-refresh) |
| `/system/worker/me` | GET | useWorkerProfile hook |
| `/system/worker/{id}/address` | PATCH | Update profile address |
| `/system/worker/{id}/account` | PATCH | Update bank account |
| `/system/worker/{id}/family-account` | PATCH | Update family account |
| `/user/profile/password` | PATCH | Change password |
| `/system/attendance/check-in` | POST | Clock in |
| `/system/attendance/check-out` | POST | Clock out |
| `/system/attendance/{id}/correction-request` | POST | Submit work effort/wage correction |
| `/system/attendance/{id}` | DELETE | Purge attendance record (test) |
| `/system/attendance/my/{year}/{month}` | GET | useMonthlyAttendance hook |
| `/system/worker/me/document` | GET | useWorkerDocuments hook |
| `/system/worker/documents/upload` | POST | Upload ID/passport document |
| `/system/partner/active` | GET | useActivePartners hook |
| `/notices/inbox?recipientType=worker` | GET | useNotices hook (polls every 5 min) |
| `/auth/user/info` | GET | AuthContext bootstrap (after refresh) |
| `/efs/api/documents?bizType=worker_contract&year={year}` | GET | useContracts hook |
| `/efs/api/documents/{id}/pdf` | GET | Fetch contract PDF |
| `/efs/api/signing-link?documentId={id}` | GET | Fetch contract signing link |
