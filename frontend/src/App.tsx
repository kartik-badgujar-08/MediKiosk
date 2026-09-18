import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { RootLayout } from './layouts/RootLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { KioskPage } from './pages/KioskPage';
import { DoctorPage } from './pages/DoctorPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="MediKiosk Application Encountered an Issue">
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route
                  path="kiosk"
                  element={
                    <ErrorBoundary fallbackTitle="Kiosk Patient Intake Workspace Error">
                      <KioskPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="doctor"
                  element={
                    <ErrorBoundary fallbackTitle="Doctor Clinical Workspace Error">
                      <DoctorPage />
                    </ErrorBoundary>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};


export default App;
