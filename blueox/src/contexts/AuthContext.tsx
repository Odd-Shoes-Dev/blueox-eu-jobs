// Custom email/password auth. Clerk is intentionally NOT used right now — this is
// a dormant swap, not a removal; see blueox-api/AUTH.md and AuthContext.clerk.tsx.
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import * as clientsService from '../services/clientsService';
import type { AppUser, Client } from '../services/types';

interface AuthContextType {
  user: AppUser | null;
  client: Client | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'workforce', phone?: string) => Promise<{ client: Client | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ client: Client | null; error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClient = async () => {
      const token = await authService.getToken();
      if (!token) {
        setClient(null);
        setLoading(false);
        return;
      }
      try {
        const { client } = await clientsService.getMe();
        setClient(client);
      } catch (err) {
        console.error('Error fetching client:', err);
        setClient(null);
      } finally {
        setLoading(false);
      }
    };
    loadClient();
  }, []);

  const user: AppUser | null = client ? { id: client.id, email: client.email } : null;

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'workforce', phone?: string) => {
    const { client, error } = await authService.signUp(email, password, fullName, role, phone);
    if (!error) setClient(client);
    return { client, error };
  };

  const signIn = async (email: string, password: string) => {
    const { client, error } = await authService.signIn(email, password);
    if (!error) setClient(client);
    return { client, error };
  };

  const signOut = async () => {
    await authService.signOut();
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{ user, client, loading, isAdmin: client?.role === 'admin', signUp, signIn, signOut }}>
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
