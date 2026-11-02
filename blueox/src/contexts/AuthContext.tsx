import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import * as authService from '../services/authService';
import * as clientsService from '../services/clientsService';
import type { AppUser, AppSession, AppAuthError, Client } from '../services/types';

interface SignUpResult {
  error: Error | AppAuthError | null;
  data?: { user: AppUser | null };
}

interface AuthContextType {
  user: AppUser | null;
  session: AppSession | null;
  client: Client | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'workforce') => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ error: Error | AppAuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await clientsService.getClientByAuthUserId(userId);
      setClient(data);
    } catch (err) {
      console.error('Error fetching client:', err);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    authService.getSession().then(({ user, session }) => {
      setSession(session);
      setUser(user);
      if (user) {
        fetchClient(user.id);
      }
      setLoading(false);
    });

    const subscription = authService.onAuthStateChange((user, session) => {
      setSession(session);
      setUser(user);
      if (user) {
        fetchClient(user.id);
      } else {
        setClient(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'workforce'): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please set up your environment variables.') };
    }

    const { user, error } = await authService.signUp(email, password);
    if (error) return { error, data: { user: null } };

    if (user) {
      const { error: clientError } = await clientsService.createClientRecord({
        auth_user_id: user.id,
        email,
        full_name: fullName,
        role,
      });
      if (clientError) return { error: clientError, data: { user } };
    }
    return { error: null, data: { user } };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured. Please set up your environment variables.') };
    }
    const { error } = await authService.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await authService.signOut();
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      client,
      loading,
      signUp,
      signIn,
      signOut,
      isAdmin: client?.role === 'admin',
      isConfigured: isSupabaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
