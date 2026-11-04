// Custom email/password auth. Clerk is intentionally NOT used right now — this is
// a dormant swap, not a removal; see blueox-api/AUTH.md and authService.clerk.ts.
import { apiFetch } from './apiClient';
import type { Client } from './types';

const TOKEN_KEY = 'blueox_auth_token';

export async function getToken(): Promise<string | null> {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore (e.g. private browsing storage restrictions)
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'student' | 'workforce',
  phone?: string
): Promise<{ client: Client | null; error: Error | null }> {
  try {
    const { token, client } = await apiFetch<{ token: string; client: Client }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, role, phone }),
    });
    setToken(token);
    return { client, error: null };
  } catch (error) {
    return { client: null, error: error as Error };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ client: Client | null; error: Error | null }> {
  try {
    const { token, client } = await apiFetch<{ token: string; client: Client }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    return { client, error: null };
  } catch (error) {
    return { client: null, error: error as Error };
  }
}

export async function signOut(): Promise<void> {
  clearToken();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
}
