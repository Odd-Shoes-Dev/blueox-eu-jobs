import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sendEmail } from '../lib/email';

// Public — the homepage's "Is Your Job Offer Real?" checker is anonymous (no auth),
// same as the chatbot's applications POST. Uses the 12th/final Vercel Hobby-plan
// function slot; any future backend route needs to extend an existing file instead.
//
// Sends two emails: an internal notification to hire@blueoxjobs.eu (so the team
// has visibility into checker usage) and, if the visitor gave an email, a copy of
// their own result to them. The internal notification's success is what the
// response status reflects; the visitor copy is best-effort.
//
// POST /api/checker-report
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { risk, total, maxScore, route, flagged, email, phone } = req.body ?? {};

  if (!risk || typeof total !== 'number') {
    return res.status(400).json({ error: 'Missing report data' });
  }

  const flaggedLines = Array.isArray(flagged) && flagged.length > 0
    ? flagged.map((f: { text: string; answer: string }) => `- ${f.text} (Answer: ${f.answer})`).join('\n')
    : 'None selected';

  const internalBody = `A visitor completed the Job Offer Checker on blueoxjobs.eu.

Risk: ${risk}
Score: ${total}/${maxScore ?? ''}
Job region: ${route?.region ?? ''}
Candidate country: ${route?.country ?? ''}
Already paid: ${route?.paid ?? ''}

Warning signs:
${flaggedLines}

Contact details provided (optional):
Email: ${email || '(not provided)'}
WhatsApp number: ${phone || '(not provided)'}`;

  const visitorBody = `BLUE OX JOBS — YOUR JOB OFFER RED-FLAG REPORT

Risk: ${risk}
Score: ${total}/${maxScore ?? ''}
Job region: ${route?.region ?? ''}
Candidate country: ${route?.country ?? ''}
Already paid: ${route?.paid ?? ''}

Warning signs:
${flaggedLines}

Next steps: Do not send money until the employer and contract are checked.

This is a red-flag check, not a definitive finding that a person or company is fraudulent.`;

  try {
    await sendEmail('hire@blueoxjobs.eu', `Job Offer Checker result — ${risk}`, internalBody);
  } catch (err) {
    console.error('[checker-report] Failed to notify hire@blueoxjobs.eu:', err);
    return res.status(502).json({ error: 'Failed to send report' });
  }

  let visitorEmailSent = false;
  if (email) {
    try {
      await sendEmail(email, 'Your Job Offer Checker Result — Blue Ox Jobs', visitorBody);
      visitorEmailSent = true;
    } catch (err) {
      console.error('[checker-report] Failed to send visitor copy:', err);
    }
  }

  return res.status(200).json({ ok: true, visitorEmailSent });
}
