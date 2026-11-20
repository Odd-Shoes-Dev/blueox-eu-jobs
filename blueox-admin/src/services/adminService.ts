import { apiFetch } from './apiClient';
import type { Client, Application, Document, Payment, ClientPaymentPhases, Job } from './types';

export interface AdminPartner {
  id: string;
  company_name: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string | null;
  registration_status: 'pending_review' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  candidate_count: number;
}

export interface AdminDashboardData {
  clients: Client[];
  applications: Application[];
  documents: Document[];
  payments: Payment[];
  paymentPhases: ClientPaymentPhases[];
  jobs: Job[];
  partners: AdminPartner[];
}

export async function setPartnerRegistrationStatus(
  id: string,
  registration_status: AdminPartner['registration_status']
): Promise<AdminPartner> {
  return apiFetch(`/api/clients?resource=partner&id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ registration_status }),
  });
}

// Bundles the admin dashboard's initial list queries into one request instead of
// 6 separate ones — see blueox-api/api/admin-dashboard.ts for why.
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>('/api/admin-dashboard');
}
