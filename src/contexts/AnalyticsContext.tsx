import React, { createContext, useContext, useEffect } from 'react';
import { appInsights } from '../lib/applicationInsights';
import { useAuth } from './AuthContext';

interface AnalyticsContextType {
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackPageView: (name: string, properties?: Record<string, any>) => void;
  trackException: (error: Error, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      appInsights.setAuthenticatedUserContext(user.id);
      appInsights.addTelemetryInitializer((envelope) => {
        if (envelope.data) {
          envelope.data.user = envelope.data.user || {};
          envelope.data.user.accountId = user.id;
          envelope.data.user.email = user.email;
        }
      });
    } else {
      appInsights.clearAuthenticatedUserContext();
    }
  }, [user]);

  const trackEvent = (name: string, properties?: Record<string, any>) => {
    appInsights.trackEvent({ name }, properties);
  };

  const trackPageView = (name: string, properties?: Record<string, any>) => {
    appInsights.trackPageView({ name, properties });
  };

  const trackException = (error: Error, properties?: Record<string, any>) => {
    appInsights.trackException({ exception: error, properties });
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackPageView, trackException }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}