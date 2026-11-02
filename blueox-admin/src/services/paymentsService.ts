import { supabase } from '../lib/supabaseClient';
import type { Payment } from './types';

export async function listPayments(): Promise<{ data: Payment[]; error: Error | null }> {
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
  return { data: data ?? [], error: error ?? null };
}

export async function addPayment(clientId: string, phase: number, amount: number): Promise<void> {
  await supabase.from('payments').insert({
    client_id: clientId,
    phase,
    amount,
    currency: 'EUR',
    status: 'pending',
  });
}

export async function updatePaymentStatus(
  id: string,
  status: string,
  verifiedBy?: string | null
): Promise<void> {
  await supabase
    .from('payments')
    .update({
      status,
      verified_by: status === 'verified' ? verifiedBy : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}
