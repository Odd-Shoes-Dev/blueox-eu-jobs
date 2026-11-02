import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import * as clientsService from '../services/clientsService';
import type { AppUser, AppSession, AppAuthError, Client } from '../services/types';

interface AuthContextType {
  user: AppUser | null;
  session: AppSession | null;
  client: Client | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AppAuthError | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = async (userId: string) => {
    try {
      const data = await clientsService.getClientByAuthUserId(userId);
      setClient(data);
    } catch (error) {
      console.log('Client fetch error:', error);
      // TODO(clerk-migration): remove this hack — it's a one-off fallback for a
      // single hardcoded admin auth user id, bypassing the DB entirely when the
      // clients row lookup fails for that id.
      if (userId === '5a236bf5-65e1-4a4c-bed4-df065c093e13') {
        const fallbackClient: Client = {
          id: 'admin-fallback',
          auth_user_id: userId,
          email: 'dqescjhu@minimax.com',
          full_name: 'Blue OX Admin',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setClient(fallbackClient);
      } else {
        setClient(null);
      }
    }
  };

  useEffect(() => {
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

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      client,
      loading,
      signIn,
      signOut,
      isAdmin: client?.role === 'admin',
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
