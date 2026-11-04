import { apiFetch } from './apiClient';
import type { ClientPaymentPhases } from './types';

export async function listPaymentPhases(): Promise<{ data: ClientPaymentPhases[]; error: Error | null }> {
  try {
    const data = await apiFetch<ClientPaymentPhases[]>('/api/payment-phases');
    return { data, error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

export async function updatePaymentPhase(
  phaseId: string,
  updateData: Record<string, unknown>
): Promise<void> {
  await apiFetch(`/api/payment-phases?id=${phaseId}`, { method: 'PATCH', body: JSON.stringify(updateData) });
}
