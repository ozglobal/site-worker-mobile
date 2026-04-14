// App.tsx
import React from 'react';
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
import { LoginPage, SmsVerificationPage, LoginSetPasswordPage } from './pages/login';
import { SignUpPage, AgreementPage, DomesticForeignPage, DomesticInfoPage, ForeignInfoPage, PassportInfoPage, SetPasswordPage } from './pages/signup';
import { SmsVerificationPage as SignupSmsVerificationPage } from './pages/signup/SmsVerification';
import { SignUpStep3Page } from './pages/signup/step3';
import { SignUpCompletePage } from './pages/signup/SignupComplete';
import { NiceApiPage } from './pages/signup/NiceApiPage';
import { Home } from './pages/home';
import { MyInfoPage } from './pages/profile';
import { WorkerTypePage } from './pages/profile/WorkerType';
import { MyInfoPage as MyInfoDetailPage } from './pages/profile/MyInfo';
import { OnboardingPage } from './pages/onboarding';
import { OnboardingOutsourcingPage } from './pages/onboarding/Outsourcing';
import { OnboardingEngineerPage } from './pages/onboarding/Engineer';
import { OnboardingDocumentsPage } from './pages/onboarding/Documents';
import { OnboardingCompanyAccountPage } from './pages/onboarding/CompanyAccount';
import { OnboardingDailyWagePage } from './pages/onboarding/DailyWage';
import { MyAccountPage } from './pages/profile/MyAccount';
import { OutsourcingPage } from './pages/profile/Outsourcing';
import { EngineerPage } from './pages/profile/Engineer';
import { EquipmentPage } from './pages/profile/Equipment';
import { EquipmentListPage } from './pages/profile/EquipmentList';
import { FamilyAccountPage } from './pages/profile/FamilyAccount';
import { ChangePasswordPage } from './pages/profile/ChangePassword';
import { PayrollAccountPage } from './pages/profile/PayrollAccount';
import { CalendarPage, ListPage, DailyDetailPage } from './pages/attendance';
import { ContractPage } from './pages/contract';
import { ScheduleAddPage } from './pages/test/ScheduleAdd';

// Public route - redirect to home if already authenticated
const PublicRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

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

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/onboarding/worker-type" element={<WorkerTypePage mode="onboarding" />} />
      <Route path="/onboarding/my-account" element={<MyAccountPage mode="onboarding" />} />
      <Route path="/onboarding/outsourcing" element={<OnboardingOutsourcingPage />} />
      <Route path="/onboarding/engineer" element={<OnboardingEngineerPage />} />
      <Route path="/onboarding/family-account" element={<FamilyAccountPage mode="onboarding" />} />
      <Route path="/onboarding/documents" element={<OnboardingDocumentsPage />} />
      <Route path="/onboarding/company-account" element={<OnboardingCompanyAccountPage />} />
      <Route path="/onboarding/payroll-account" element={<PayrollAccountPage mode="onboarding" />} />
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
      <Route path="/signup/domestic-info" element={<PublicRoute><DomesticInfoPage /></PublicRoute>} />
      <Route path="/signup/foreign-info" element={<PublicRoute><ForeignInfoPage /></PublicRoute>} />
      <Route path="/signup/passport-info" element={<PublicRoute><PassportInfoPage /></PublicRoute>} />
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
      <Route path="/profile/myinfo" element={<MyInfoDetailPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/test/schedule-add" element={<ScheduleAddPage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      {/* Catch-all: redirect unknown routes to home or login */}
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
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

