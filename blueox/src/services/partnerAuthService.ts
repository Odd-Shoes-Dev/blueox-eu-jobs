// Partner Portal auth — mirrors authService.ts's pattern exactly, but with its
// own localStorage key, so a partner and a regular client can each be logged in
// independently in the same browser without clobbering each other's token.
import { apiFetch } from './apiClient';

const TOKEN_KEY = 'blueox_partner_auth_token';
const PARTNER_KEY = 'blueox_partner_data';

export interface Partner {
  id: string;
  company_name: string;
  contact_person_name?: string;
  contact_email: string;
  contact_phone?: string;
  email: string;
  registration_status: string;
}

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
    localStorage.removeItem(PARTNER_KEY);
  } catch {
    // ignore
  }
}

// There's no dedicated "get my partner profile" endpoint — the partner object
// returned at signup/login is cached here and rehydrated on page load, rather
// than re-verified against the server each time. Good enough for now; a stale
// registration_status just means logging out/in picks up the latest value.
export function getStoredPartner(): Partner | null {
  try {
    const raw = localStorage.getItem(PARTNER_KEY);
    return raw ? (JSON.parse(raw) as Partner) : null;
  } catch {
    return null;
  }
}

function storePartner(partner: Partner): void {
  try {
    localStorage.setItem(PARTNER_KEY, JSON.stringify(partner));
  } catch {
    // ignore
  }
}

// apiFetch always attaches the regular client token from authService.ts — this
// wraps it to force the partner token into the Authorization header instead
// (options.headers is spread after apiFetch's own computed header, so it wins).
export async function partnerApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

export async function signUp(payload: {
  company_name: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone?: string;
  email: string;
  password: string;
}): Promise<{ partner: Partner | null; error: Error | null }> {
  try {
    const { token, partner } = await apiFetch<{ token: string; partner: Partner }>('/api/auth/partner-signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(token);
    storePartner(partner);
    return { partner, error: null };
  } catch (error) {
    return { partner: null, error: error as Error };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ partner: Partner | null; error: Error | null }> {
  try {
    const { token, partner } = await apiFetch<{ token: string; partner: Partner }>('/api/auth/partner-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    storePartner(partner);
    return { partner, error: null };
  } catch (error) {
    return { partner: null, error: error as Error };
  }
}

export async function signOut(): Promise<void> {
  clearToken();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email, kind: 'partner' }) });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword, kind: 'partner' }) });
}
