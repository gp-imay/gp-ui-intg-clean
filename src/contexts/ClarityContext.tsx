import React, { createContext, useContext, useEffect } from 'react';
import { clarity, initializeClarity } from '../lib/clarity';
import { useAuth } from './AuthContext';

interface ClarityContextType {
  identify: (userId: string, sessionId?: string, pageId?: string) => void;
  setTag: (key: string, value: string) => void;
}

const ClarityContext = createContext<ClarityContextType | undefined>(undefined);

export function ClarityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    initializeClarity();
  }, []);

  useEffect(() => {
    if (user) {
      // Identify user for Clarity
      clarity.identify(user.id, undefined, undefined, {
        email: user.email,
        name: user.user_metadata?.full_name,
      });
      
      // Set user-related tags
      clarity.set('userRole', user.role || 'user');
    //   clarity.set('userPlan', user.subscription_tier || 'free');
    }
  }, [user]);

  const identify = (userId: string, sessionId?: string, pageId?: string) => {
    clarity.identify(userId, sessionId, pageId);
  };

  const setTag = (key: string, value: string) => {
    clarity.set(key, value);
  };

  return (
    <ClarityContext.Provider value={{ identify, setTag }}>
      {children}
    </ClarityContext.Provider>
  );
}

export function useClarity() {
  const context = useContext(ClarityContext);
  if (context === undefined) {
    throw new Error('useClarity must be used within a ClarityProvider');
  }
  return context;
}