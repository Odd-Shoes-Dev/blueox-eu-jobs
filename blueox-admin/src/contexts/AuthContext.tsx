import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import * as clientsService from '../services/clientsService';
import type { AppUser, Client } from '../services/types';

interface AuthContextType {
  user: AppUser | null;
  client: Client | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const user: AppUser | null = clerkUser
    ? { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress }
    : null;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setClient(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    clientsService
      .getMe()
      .then(({ client }) => setClient(client))
      .catch((err) => {
        // No more hardcoded admin-id fallback here (Stage 1's TODO) — admin status
        // now comes cleanly from clients.role, set directly in the database.
        console.log('Client fetch error:', err);
        setClient(null);
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  const signOut = async () => {
    await clerkSignOut();
    setClient(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        client,
        loading: !isLoaded || loading,
        isAdmin: client?.role === 'admin',
        signOut,
      }}
    >
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
