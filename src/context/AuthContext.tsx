import React, { createContext, useContext, useState, useCallback } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile } from '../types/index.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginAsDemoUser: () => Promise<boolean>;
  updateProfileName: (name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store token and user in memory as mandated by security guidelines
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, {
        ...options,
        headers,
      });
    },
    [token]
  );

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        return false;
      }
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      setError('Network error while signing in. Please check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create your account. Please check your details.');
        return false;
      }
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      setError('Network error during registration. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: credential.user.displayName || credential.user.email?.split('@')[0] || 'User',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not synchronize Google account.');
        return false;
      }
      setToken(idToken);
      setUser(data.user);
      return true;
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else {
        setError('Google sign-in could not be completed. You can also sign in with email or use the Demo Account.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start demo session.');
        return false;
      }
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      setError('Network error while starting demo session.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileName = async (name: string): Promise<boolean> => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update your name.');
        return false;
      }
      setUser(data.user);
      return true;
    } catch {
      setError('Network error while updating profile.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore if not signed into Firebase
    }
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        clearError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsDemoUser,
        updateProfileName,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
