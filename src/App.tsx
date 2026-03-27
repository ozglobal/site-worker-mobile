// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
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
import { AffiliationPage } from './pages/profile/Affiliation';
import { MyInfoPage as MyInfoDetailPage } from './pages/profile/MyInfo';
import { OnboardingPage } from './pages/onboarding';
import { OnboardingAffiliationPage } from './pages/onboarding/Affiliation';
import { OnboardingMyAccountPage } from './pages/onboarding/MyAccount';
import { OnboardingOutsourcingPage } from './pages/onboarding/Outsourcing';
import { OnboardingEngineerPage } from './pages/onboarding/Engineer';
import { OnboardingFamilyAccountPage } from './pages/onboarding/FamilyAccount';
import { OnboardingDocumentsPage } from './pages/onboarding/Documents';
import { OnboardingCompanyAccountPage } from './pages/onboarding/CompanyAccount';
import { OnboardingOutsourcingDocumentsPage } from './pages/onboarding/OutsourcingDocuments';
import { OnboardingEquipmentPage } from './pages/onboarding/Equipment';
import { OnboardingEquipmentListPage } from './pages/onboarding/EquipmentList';
import { OnboardingPayrollAccountPage } from './pages/onboarding/PayrollAccount';
import { OnboardingDocumentCaptureGuideIdcardPage } from './pages/onboarding/DocumentCaptureGuideIdcard';
import { OnboardingDocumentCaptureGuidePassportPage } from './pages/onboarding/DocumentCaptureGuidePassport';
import { OnboardingIdCardPreviewFrPage } from './pages/onboarding/IdCardPreviewFr';
import { OnboardingIdCardPreviewKrPage } from './pages/onboarding/IdCardPreviewKr';
import { OnboardingPassportPreviewPage } from './pages/onboarding/PassportPreview';
import { MyAccountPage } from './pages/profile/MyAccount';
import { OutsourcingPage } from './pages/profile/Outsourcing';
import { EngineerPage } from './pages/profile/Engineer';
import { EquipmentPage } from './pages/profile/Equipment';
import { FamilyAccountPage } from './pages/profile/FamilyAccount';
import { ChangePasswordPage } from './pages/profile/ChangePassword';
import { PayrollAccountPage } from './pages/profile/PayrollAccount';
import { SosokPage } from './pages/profile/Sosok';
import { CalendarPage, ListPage } from './pages/attendance';
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

  return isAuthenticated ? <Navigate to="/home" replace /> : children;
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
      <Route path="/onboarding/affiliation" element={<OnboardingAffiliationPage />} />
      <Route path="/onboarding/my-account" element={<OnboardingMyAccountPage />} />
      <Route path="/onboarding/outsourcing" element={<OnboardingOutsourcingPage />} />
      <Route path="/onboarding/engineer" element={<OnboardingEngineerPage />} />
      <Route path="/onboarding/family-account" element={<OnboardingFamilyAccountPage />} />
      <Route path="/onboarding/documents" element={<OnboardingDocumentsPage />} />
      <Route path="/onboarding/company-account" element={<OnboardingCompanyAccountPage />} />
      <Route path="/onboarding/outsourcing-documents" element={<OnboardingOutsourcingDocumentsPage />} />
      <Route path="/onboarding/equipments" element={<OnboardingEquipmentPage />} />
      <Route path="/onboarding/equipments-list" element={<OnboardingEquipmentListPage />} />
      <Route path="/onboarding/payroll-account" element={<OnboardingPayrollAccountPage />} />
      <Route path="/onboarding/documents/capture-guide-idcard" element={<OnboardingDocumentCaptureGuideIdcardPage />} />
      <Route path="/onboarding/documents/capture-guide-passport" element={<OnboardingDocumentCaptureGuidePassportPage />} />
      <Route path="/onboarding/documents/id-card-preview" element={<OnboardingIdCardPreviewFrPage />} />
      <Route path="/onboarding/documents/id-card-preview-kr" element={<OnboardingIdCardPreviewKrPage />} />
      <Route path="/onboarding/documents/passport-preview" element={<OnboardingPassportPreviewPage />} />
      <Route path="/profile/my-account" element={<MyAccountPage />} />
      <Route path="/profile/family-account" element={<FamilyAccountPage />} />
      <Route path="/profile/outsourcing" element={<OutsourcingPage />} />
      <Route path="/profile/engineer" element={<EngineerPage />} />
      <Route path="/profile/equipments" element={<EquipmentPage />} />
      <Route path="/profile/payroll-account" element={<PayrollAccountPage />} />
      <Route path="/profile/sosok" element={<SosokPage />} />
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
      <Route path="/contract" element={<ContractPage />} />
      <Route path="/profile" element={<MyInfoPage />} />
      <Route path="/profile/affiliation" element={<AffiliationPage />} />
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
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

