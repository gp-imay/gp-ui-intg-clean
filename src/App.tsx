import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { Dashboard } from './pages/Dashboard';
import ScriptEditorPageWithAlerts from './pages/ScriptEditorPage';
// import { HomePage } from './pages/HomePage';
import { AlertProvider } from './components/Alert';
import { ClarityProvider } from './contexts/ClarityContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { supabase } from './lib/supabase';

// Private route component to protect routes that require authentication
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" />;
}
const handleOAuthRedirect = async () => {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken) {
      // Set the session with the tokens from the URL
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (error) {
        console.error('Error setting session:', error);
      } else {
        console.log('Successfully authenticated');
        // You could redirect here if needed
        window.location.href = '/'; // Redirect to dashboard
      }
    }
  }
};
handleOAuthRedirect();


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClarityProvider>
          <AnalyticsProvider>
            <AlertProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                {/* Script editor route */}
                <Route
                  path="/editor/:scriptId"
                  element={
                    <PrivateRoute>
                      <ScriptEditorPageWithAlerts />
                    </PrivateRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AlertProvider>
          </AnalyticsProvider>

        </ClarityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;