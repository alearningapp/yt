'use client';

import { createAuthClient } from 'better-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';

// Create the auth client
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});

// Create a context for the auth client
const AuthContext = createContext<{
  authClient: typeof authClient;
  session: { user?: { id: string; name: string; email: string } } | null;
  isLoading: boolean;
}>({
  authClient,
  session: null,
  isLoading: true,
});

export { authClient };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize session on mount
    const initSession = async () => {
      try {
        // This is a placeholder - better-auth might have a different way to get session
        // For now, we'll set it to null and let components handle auth state
        setSession(null);
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  return (
    <AuthContext.Provider value={{ authClient, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
