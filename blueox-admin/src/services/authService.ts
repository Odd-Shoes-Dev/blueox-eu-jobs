// Custom email/password auth. Clerk is intentionally NOT used right now — this is
// a dormant swap, not a removal; see blueox-api/AUTH.md and authService.clerk.ts.
import { apiFetch } from './apiClient';
import type { Client } from './types';

const TOKEN_KEY = 'blueox_admin_auth_token';

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
    // ignore
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
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
