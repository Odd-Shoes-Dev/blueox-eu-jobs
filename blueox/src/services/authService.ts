import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { AppUser, AppSession, AppAuthError } from './types';

function toAppUser(user: SupabaseUser | null | undefined): AppUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email };
}

function toAppSession(session: SupabaseSession | null | undefined): AppSession | null {
  if (!session?.user) return null;
  return { user: toAppUser(session.user)! };
}

export async function getSession(): Promise<{ user: AppUser | null; session: AppSession | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  return { user: toAppUser(session?.user), session: toAppSession(session) };
}

export function onAuthStateChange(
  callback: (user: AppUser | null, session: AppSession | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(toAppUser(session?.user), toAppSession(session));
  });
  return subscription;
}

export async function signUp(
  email: string,
  password: string
): Promise<{ user: AppUser | null; error: AppAuthError | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: toAppUser(data?.user), error };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error: AppAuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return toAppUser(user);
}
