// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import { MyAccountPage } from './pages/profile/MyAccount';
import { OutsourcingPage } from './pages/profile/Outsourcing';
import { EngineerPage } from './pages/profile/Engineer';
import { EquipmentsPage } from './pages/profile/Equipments';
import { FamilyAccountPage } from './pages/profile/FamilyAccount';
import { ChangePasswordPage } from './pages/profile/ChangePassword';
import { CalendarPage, ListPage } from './pages/attendance';
import { ContractPage } from './pages/contract';
import { QrGeneratorPage } from './pages/qr-generator';

// Public route - redirect to home if already authenticated
const PublicRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

// Catch-all redirect component
const CatchAllRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/" : "/login"} replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/profile/my-account" element={<MyAccountPage />} />
      <Route path="/profile/family-account" element={<FamilyAccountPage />} />
      <Route path="/profile/outsourcing" element={<OutsourcingPage />} />
      <Route path="/profile/engineer" element={<EngineerPage />} />
      <Route path="/profile/equipments" element={<EquipmentsPage />} />
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
      <Route path="/qr-generator" element={<QrGeneratorPage />} />
      <Route path="/profile" element={<MyInfoPage />} />
      <Route path="/profile/affiliation" element={<AffiliationPage />} />
      <Route path="/profile/myinfo" element={<MyInfoDetailPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/" element={<Home />} />
      {/* Catch-all: redirect unknown routes to home or login */}
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;

