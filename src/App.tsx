// App.tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { OnboardingDraftProvider } from './contexts/OnboardingDraftContext';
import { ToastContainer } from './components/ui/toast';
import { Spinner } from '@/components/ui/spinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy-load all route components so the /login path only pulls its own chunk.
const lazyNamed = <T extends Record<string, React.ComponentType<any>>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) => lazy(() => loader().then((m) => ({ default: m[key] })));

const LoginPage = lazyNamed(() => import('./pages/login'), 'LoginPage');
const SmsVerificationPage = lazyNamed(() => import('./pages/login'), 'SmsVerificationPage');
const LoginSetPasswordPage = lazyNamed(() => import('./pages/login'), 'LoginSetPasswordPage');

const SignUpPage = lazyNamed(() => import('./pages/signup'), 'SignUpPage');
const AgreementPage = lazyNamed(() => import('./pages/signup'), 'AgreementPage');
const DomesticForeignPage = lazyNamed(() => import('./pages/signup'), 'DomesticForeignPage');
const SignupRrnPage = lazyNamed(() => import('./pages/signup'), 'SignupRrnPage');
const SignupFrnPage = lazyNamed(() => import('./pages/signup'), 'SignupFrnPage');
const SignupPnPage = lazyNamed(() => import('./pages/signup'), 'SignupPnPage');
const SetPasswordPage = lazyNamed(() => import('./pages/signup'), 'SetPasswordPage');
const SignupSmsVerificationPage = lazyNamed(() => import('./pages/signup/SmsVerification'), 'SmsVerificationPage');
const SignUpStep3Page = lazyNamed(() => import('./pages/signup/step3'), 'SignUpStep3Page');
const SignUpCompletePage = lazyNamed(() => import('./pages/signup/SignupComplete'), 'SignUpCompletePage');
const NiceApiPage = lazyNamed(() => import('./pages/signup/NiceApiPage'), 'NiceApiPage');

const Home = lazyNamed(() => import('./pages/home'), 'Home');

const MyInfoPage = lazyNamed(() => import('./pages/profile'), 'MyInfoPage');
const WorkerTypePage = lazyNamed(() => import('./pages/profile/WorkerType'), 'WorkerTypePage');
const MyInfoRrnPage = lazyNamed(() => import('./pages/profile/MyInfoRrn'), 'MyInfoRrnPage');
const MyInfoFrnPage = lazyNamed(() => import('./pages/profile/MyInfoFrn'), 'MyInfoFrnPage');
const MyInfoPnPage = lazyNamed(() => import('./pages/profile/MyInfoPn'), 'MyInfoPnPage');
const ProfileDocumentsPage = lazyNamed(() => import('./pages/profile/Documents'), 'ProfileDocumentsPage');
const DocumentViewerPage = lazyNamed(() => import('./pages/profile/DocumentViewer'), 'DocumentViewerPage');
const AlienRegistrationPage = lazyNamed(() => import('./pages/profile/AlienRegistration'), 'AlienRegistrationPage');
const MyAccountPage = lazyNamed(() => import('./pages/profile/MyAccount'), 'MyAccountPage');
const OutsourcingPage = lazyNamed(() => import('./pages/profile/Outsourcing'), 'OutsourcingPage');
const EngineerPage = lazyNamed(() => import('./pages/profile/Engineer'), 'EngineerPage');
const EquipmentPage = lazyNamed(() => import('./pages/profile/Equipment'), 'EquipmentPage');
const EquipmentListPage = lazyNamed(() => import('./pages/profile/EquipmentList'), 'EquipmentListPage');
const FamilyAccountPage = lazyNamed(() => import('./pages/profile/FamilyAccount'), 'FamilyAccountPage');
const ChangePasswordPage = lazyNamed(() => import('./pages/profile/ChangePassword'), 'ChangePasswordPage');
const PayrollAccountPage = lazyNamed(() => import('./pages/profile/PayrollAccount'), 'PayrollAccountPage');

const OnboardingPage = lazyNamed(() => import('./pages/onboarding'), 'OnboardingPage');
const OnboardingOutsourcingPage = lazyNamed(() => import('./pages/onboarding/Outsourcing'), 'OnboardingOutsourcingPage');
const OnboardingEngineerPage = lazyNamed(() => import('./pages/onboarding/Engineer'), 'OnboardingEngineerPage');
const OnboardingDocumentsPage = lazyNamed(() => import('./pages/onboarding/Documents'), 'OnboardingDocumentsPage');
const OnboardingCompanyAccountPage = lazyNamed(() => import('./pages/onboarding/CompanyAccount'), 'OnboardingCompanyAccountPage');
const OnboardingDailyWagePage = lazyNamed(() => import('./pages/onboarding/DailyWage'), 'OnboardingDailyWagePage');

const CalendarPage = lazyNamed(() => import('./pages/attendance'), 'CalendarPage');
const ListPage = lazyNamed(() => import('./pages/attendance'), 'ListPage');
const DailyDetailPage = lazyNamed(() => import('./pages/attendance'), 'DailyDetailPage');

const ContractPage = lazyNamed(() => import('./pages/contract'), 'ContractPage');
const ScheduleAddPage = lazyNamed(() => import('./pages/test/ScheduleAdd'), 'ScheduleAddPage');

// Public route — render children immediately; only redirect once auth is known.
const PublicRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    // Do NOT clear the flag here — StrictMode double-renders would lose it
    // between the first and second render. OnboardingPage clears it on mount.
    const firstLogin = sessionStorage.getItem('postLoginFirstLogin') === '1';
    return <Navigate to={firstLogin ? '/onboarding' : '/home'} replace />;
  }
  return children;
};

// Catch-all redirect component
const CatchAllRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
};

const RouteFallback: React.FC = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/worker-type" element={<WorkerTypePage mode="onboarding" />} />
        <Route path="/onboarding/my-account" element={<MyAccountPage mode="onboarding" />} />
        <Route path="/onboarding/outsourcing" element={<OnboardingOutsourcingPage />} />
        <Route path="/onboarding/engineer" element={<OnboardingEngineerPage />} />
        <Route path="/onboarding/family-account" element={<FamilyAccountPage mode="onboarding" />} />
        <Route path="/onboarding/documents" element={<OnboardingDocumentsPage />} />
        <Route path="/onboarding/company-account" element={<OnboardingCompanyAccountPage />} />
        <Route path="/onboarding/payroll-account" element={<PayrollAccountPage />} />
        <Route path="/onboarding/daily-wage" element={<OnboardingDailyWagePage />} />
        <Route path="/profile/my-account" element={<MyAccountPage />} />
        <Route path="/profile/family-account" element={<FamilyAccountPage />} />
        <Route path="/profile/outsourcing" element={<OutsourcingPage />} />
        <Route path="/profile/engineer" element={<EngineerPage />} />
        <Route path="/profile/equipments" element={<EquipmentPage />} />
        <Route path="/profile/equipments-list" element={<EquipmentListPage />} />
        <Route path="/profile/payroll-account" element={<PayrollAccountPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/login/sms-verification" element={<PublicRoute><SmsVerificationPage /></PublicRoute>} />
        <Route path="/login/set-password" element={<PublicRoute><LoginSetPasswordPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route path="/signup/sms-verification" element={<PublicRoute><SignupSmsVerificationPage /></PublicRoute>} />
        <Route path="/signup/nice-api" element={<PublicRoute><NiceApiPage /></PublicRoute>} />
        <Route path="/signup/agreement" element={<PublicRoute><AgreementPage /></PublicRoute>} />
        <Route path="/signup/domestic-foreign" element={<PublicRoute><DomesticForeignPage /></PublicRoute>} />
        <Route path="/signup/signup-rrn" element={<PublicRoute><SignupRrnPage /></PublicRoute>} />
        <Route path="/signup/signup-frn" element={<PublicRoute><SignupFrnPage /></PublicRoute>} />
        <Route path="/signup/signup-pn" element={<PublicRoute><SignupPnPage /></PublicRoute>} />
        <Route path="/signup/set-password" element={<PublicRoute><SetPasswordPage /></PublicRoute>} />
        <Route path="/signup/step3" element={<PublicRoute><SignUpStep3Page /></PublicRoute>} />
        <Route path="/signup/complete" element={<PublicRoute><SignUpCompletePage /></PublicRoute>} />
        <Route path="/home" element={<Home />} />
        <Route path="/attendance" element={<CalendarPage />} />
        <Route path="/attendance/list" element={<ListPage />} />
        <Route path="/attendance/detail/:date" element={<DailyDetailPage />} />
        <Route path="/contract" element={<ContractPage />} />
        <Route path="/profile" element={<MyInfoPage />} />
        <Route path="/profile/worker-type" element={<WorkerTypePage />} />
        <Route path="/profile/myinfo-rrn" element={<MyInfoRrnPage />} />
        <Route path="/profile/myinfo-frn" element={<MyInfoFrnPage />} />
        <Route path="/profile/myinfo-pn" element={<MyInfoPnPage />} />
        <Route path="/profile/documents" element={<ProfileDocumentsPage />} />
        <Route path="/profile/documents/view/:slug" element={<DocumentViewerPage />} />
        <Route path="/profile/documents/alien-reg" element={<AlienRegistrationPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/test/schedule-add" element={<ScheduleAddPage />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Catch-all: redirect unknown routes to home or login */}
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <OnboardingDraftProvider>
              <Router>
                <AppRoutes />
              </Router>
            </OnboardingDraftProvider>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
