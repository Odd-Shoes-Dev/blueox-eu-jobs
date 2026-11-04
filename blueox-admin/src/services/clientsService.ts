import { apiFetch } from './apiClient';
import type { Client } from './types';

export async function getMe(): Promise<{ client: Client; isAdmin: boolean }> {
  return apiFetch('/api/me');
}

export async function listClients(): Promise<Client[]> {
  return apiFetch('/api/clients');
}

export async function testClientsConnection(): Promise<{ data: unknown; error: Error | null }> {
  try {
    const data = await apiFetch('/api/clients');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
