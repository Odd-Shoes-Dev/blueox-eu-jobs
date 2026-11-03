// Clerk's React SDK keeps a global `window.Clerk` singleton once <ClerkProvider>
// has mounted, which is how a plain (non-hook) service module gets a fresh session
// token. UI code should prefer Clerk's own hooks (useAuth/useUser) for auth state —
// this is only for apiClient to attach a bearer token to backend requests.
export async function getToken(): Promise<string | null> {
  const clerk = (window as unknown as { Clerk?: { session?: { getToken(): Promise<string | null> } } }).Clerk;
  if (!clerk?.session) return null;
  try {
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}
