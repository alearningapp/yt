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
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ,
});

interface AuthResponse {
  success: boolean;
  error?: string | { message: string; code?: string };
  data?: {
    user: User;
    token?: string;
  };
}

// Helper type to convert auth client response to AuthResponse
type AuthClientResponse = {
  success: boolean;
  error?: { message: string; code?: string };
  data?: {
    user: User;
    token?: string;
  };
};

// Create a context for the auth client
const AuthContext = createContext<{
  authClient: typeof authClient;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<AuthResponse>;
  signIn: (credentials: { email: string; password: string, rememberMe: boolean }) => Promise<AuthResponse>;
  signUp: (credentials: { email: string; password: string; name: string }) => Promise<AuthResponse>;
}>({
  authClient,
  session: null,
  isLoading: true,
  signOut: async () => ({ success: false, error: 'Not initialized' }),
  signIn: async () => ({ success: false, error: 'Not initialized' }),
  signUp: async () => ({ success: false, error: 'Not initialized' }),
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
  const signOut = async (): Promise<AuthResponse> => {
    try {
      console.log('signing out');
      const result = await authClient.signOut();
      setSession(null);
      // Handle both success and error responses from auth client
      if ('error' in result && result.error) {
        return {
          success: false,
          error: { 
            message: result.error.message || 'Sign out failed',
            ...(result.error.code && { code: result.error.code })
          }
        };
      }
      return {
        success: true,
        data: session?.user ? {
          user: session.user,
          token: undefined
        } : undefined
      };
    } catch (error) {
      console.error('Error signing out:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  };

  // Sign in function
  const signIn = async (credentials: { email: string; password: string, rememberMe: boolean }): Promise<AuthResponse> => {
    try {
      const result = await authClient.signIn.email(credentials);
      if ('error' in result && result.error) {
        return {
          success: false,
          error: { 
            message: result.error.message || 'Sign in failed',
            ...(result.error.code && { code: result.error.code })
          }
        };
      }
      if (result.data?.user) {
        setSession({ user: result.data.user });
        router.push('/');
      }
      return {
        success: true,
        data: result.data ? {
          user: result.data.user,
          token: result.data.token || undefined
        } : undefined
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  };

  // Sign up function
  const signUp = async (credentials: { email: string; password: string; name: string }): Promise<AuthResponse> => {
    try {
      const result = await authClient.signUp.email(credentials);
      if ('error' in result && result.error) {
        return {
          success: false,
          error: { 
            message: result.error.message || 'Sign up failed',
            ...(result.error.code && { code: result.error.code })
          }
        };
      }
      if (result.data?.user) {
        setSession({ user: result.data.user });
        router.push('/');
      }
      return {
        success: true,
        data: result.data ? {
          user: result.data.user,
          token: result.data.token ? result.data.token : undefined
        } : undefined
      };
    } catch (error) {
      console.error('Error signing up:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
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