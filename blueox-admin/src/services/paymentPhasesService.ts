import { supabase } from '../lib/supabaseClient';
import type { ClientPaymentPhases } from './types';

export async function listPaymentPhases(): Promise<{ data: ClientPaymentPhases[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('client_payment_phases')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data ?? [], error: error ?? null };
}

export async function updatePaymentPhase(
  phaseId: string,
  updateData: Record<string, unknown>
): Promise<void> {
  await supabase.from('client_payment_phases').update(updateData).eq('id', phaseId);
}
