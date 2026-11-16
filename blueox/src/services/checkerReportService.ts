import { apiFetch } from './apiClient';

export interface CheckerReportPayload {
  risk: string;
  total: number;
  maxScore: number;
  route: { region: string | null; country: string; paid: string | null };
  flagged: { text: string; answer: string }[];
  email?: string;
  phone?: string;
  // Only true for "Email me this report" — "Request a callback" leaves this
  // unset so the visitor isn't auto-emailed a copy, just notified via the
  // internal hire@blueoxjobs.eu email that the team should reach out.
  sendCopy?: boolean;
}

export async function sendCheckerReport(payload: CheckerReportPayload): Promise<void> {
  await apiFetch<void>('/api/checker-report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
