import { apiFetch } from './apiClient';
import type { Payment } from './types';

export async function listPayments(): Promise<{ data: Payment[]; error: Error | null }> {
  try {
    const data = await apiFetch<Payment[]>('/api/payments');
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

export async function addPayment(clientId: string, phase: number, amount: number): Promise<void> {
  await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify({ client_id: clientId, phase, amount }) });
}

// verifiedBy is unused server-side now — the backend uses the authed admin's own id.
export async function updatePaymentStatus(
  id: string,
  status: string,
  _verifiedBy?: string | null
): Promise<void> {
  await apiFetch(`/api/payments?id=${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
