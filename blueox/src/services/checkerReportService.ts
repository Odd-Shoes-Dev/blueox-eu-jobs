import { apiFetch } from './apiClient';

export interface CheckerReportPayload {
  risk: string;
  total: number;
  maxScore: number;
  route: { region: string | null; country: string; paid: string | null };
  flagged: { text: string; answer: string }[];
  email?: string;
  phone?: string;
}

export async function sendCheckerReport(payload: CheckerReportPayload): Promise<void> {
  await apiFetch<void>('/api/checker-report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
