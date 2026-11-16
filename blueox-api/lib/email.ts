import { Resend } from 'resend';

// Sends via Resend when RESEND_API_KEY is set; otherwise falls back to logging,
// so local dev / preview deployments without the key still exercise the caller's
// code path end-to-end instead of throwing.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_ADDRESS = 'Blue Ox Jobs <noreply@blueoxjobs.eu>';

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!resend) {
    console.log(`[email stub — RESEND_API_KEY not set] To: ${to}\nSubject: ${subject}\n\n${body}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    text: body,
  });

  if (error) {
    console.error('[email] Resend send failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
