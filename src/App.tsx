// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/login';
import { SignUpPage } from './pages/signup';
import { SignUpStep2Page } from './pages/signup/step2';
import { SignUpStep3Page } from './pages/signup/step3';
import { SignUpCompletePage } from './pages/signup/complete';
import { Home } from './pages/home';
import { ProfilePage } from './pages/profile';
import { AffiliationPage } from './pages/profile/Affiliation';
import { MyInfoPage } from './pages/profile/MyInfo';
import { OnboardingPage } from './pages/onboarding';
import { PayrollAccountPage } from './pages/onboarding/PayrollAccount';
import { OutsourcingPage } from './pages/onboarding/Outsourcing';
import { EngineerPage } from './pages/onboarding/Engineer';
import { EquipmentsPage } from './pages/onboarding/Equipments';
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
      <Route path="/onboarding/payroll-account" element={<PayrollAccountPage />} />
      <Route path="/onboarding/outsourcing" element={<OutsourcingPage />} />
      <Route path="/onboarding/engineer" element={<EngineerPage />} />
      <Route path="/onboarding/equipments" element={<EquipmentsPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/signup/step2" element={<PublicRoute><SignUpStep2Page /></PublicRoute>} />
      <Route path="/signup/step3" element={<PublicRoute><SignUpStep3Page /></PublicRoute>} />
      <Route path="/signup/complete" element={<PublicRoute><SignUpCompletePage /></PublicRoute>} />
      <Route path="/home" element={<Home />} />
      <Route path="/attendance" element={<CalendarPage />} />
      <Route path="/attendance/list" element={<ListPage />} />
      <Route path="/contract" element={<ContractPage />} />
      <Route path="/qr-generator" element={<QrGeneratorPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/affiliation" element={<AffiliationPage />} />
      <Route path="/profile/myinfo" element={<MyInfoPage />} />
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

