'use client';

import { createAuthClient } from 'better-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Define session type based on better-auth structure
interface User {
  id: string;
  name: string;
  email: string;
}

interface Session {
  user?: User;
}

// Create the auth client
const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});

// Create a context for the auth client
const AuthContext = createContext<{
  authClient: typeof authClient;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (credentials: { email: string; password: string }) => Promise<any>;
  signUp: (credentials: { email: string; password: string; name: string }) => Promise<any>;
}>({
  authClient,
  session: null,
  isLoading: true,
  signOut: async () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
});

export { authClient };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();


  useEffect(() => {
    // Initialize session on mount
    const initSession = async () => {
      try {
        // Get the current session using better-auth's getSession method
        const { data } = await authClient.getSession();
        setSession(data || null);
      } catch (error) {
        console.error('Error initializing session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Better-auth typically handles session persistence automatically
    // via cookies/localStorage, so we don't need real-time listeners
    // The session will be maintained across page refreshes

  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      console.log('signing out');
      const result = await authClient.signOut();
      setSession(null);
      return result;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Sign in function
  const signIn = async (credentials: { email: string; password: string }) => {
    try {
      const result = await authClient.signIn.email(credentials);
      if (result.data) {
        setSession({ user: result.data.user });
        router.push('/'); 

      }
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign up function
  const signUp = async (credentials: { email: string; password: string; name: string }) => {
    try {
      const result = await authClient.signUp.email(credentials);
      if (result.data) {
        setSession({ user: result.data.user });
        router.push('/'); 

      }
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Optional: Add social sign-in methods
  const signInWithGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/', // Adjust as needed
      });
    } catch (error) {
      console.error('Error with Google sign-in:', error);
      throw error;
    }
  };

  const value = {
    authClient,
    session,
    isLoading,
    signOut,
    signIn,
    signUp,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
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