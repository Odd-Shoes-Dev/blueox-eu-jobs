// Mirrors AuthContext.tsx's pattern, but for the Partner Portal — mounted only
// around the /partner-portal/* route subtree (see App.tsx), not app-wide, so it
// never interferes with the regular client AuthContext used elsewhere.
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as partnerAuthService from '../services/partnerAuthService';
import type { Partner } from '../services/partnerAuthService';

interface PartnerAuthContextType {
  partner: Partner | null;
  loading: boolean;
  signUp: (payload: {
    company_name: string;
    contact_person_name: string;
    contact_email: string;
    contact_phone?: string;
    email: string;
    password: string;
  }) => Promise<{ partner: Partner | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ partner: Partner | null; error: Error | null }>;
  signOut: () => Promise<void>;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | undefined>(undefined);

export const PartnerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPartner = async () => {
      const token = await partnerAuthService.getToken();
      setPartner(token ? partnerAuthService.getStoredPartner() : null);
      setLoading(false);
    };
    loadPartner();
  }, []);

  const signUp = async (payload: Parameters<PartnerAuthContextType['signUp']>[0]) => {
    const { partner, error } = await partnerAuthService.signUp(payload);
    if (!error) setPartner(partner);
    return { partner, error };
  };

  const signIn = async (email: string, password: string) => {
    const { partner, error } = await partnerAuthService.signIn(email, password);
    if (!error) setPartner(partner);
    return { partner, error };
  };

  const signOut = async () => {
    await partnerAuthService.signOut();
    setPartner(null);
  };

  return (
    <PartnerAuthContext.Provider value={{ partner, loading, signUp, signIn, signOut }}>
      {children}
    </PartnerAuthContext.Provider>
  );
};

export const usePartnerAuth = () => {
  const context = useContext(PartnerAuthContext);
  if (context === undefined) {
    throw new Error('usePartnerAuth must be used within a PartnerAuthProvider');
  }
  return context;
};
