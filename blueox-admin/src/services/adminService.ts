import { apiFetch } from './apiClient';
import type { Client, Application, Document, Payment, ClientPaymentPhases, Job } from './types';

export interface AdminDashboardData {
  clients: Client[];
  applications: Application[];
  documents: Document[];
  payments: Payment[];
  paymentPhases: ClientPaymentPhases[];
  jobs: Job[];
}

// Bundles the admin dashboard's initial list queries into one request instead of
// 6 separate ones — see blueox-api/api/admin-dashboard.ts for why.
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>('/api/admin-dashboard');
}
