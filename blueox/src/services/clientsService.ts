import { apiFetch } from './apiClient';
import type { Client } from './types';

export async function getMe(): Promise<{ client: Client; isAdmin: boolean }> {
  return apiFetch('/api/me');
}

export async function listClients(): Promise<Client[]> {
  return apiFetch('/api/clients');
}
