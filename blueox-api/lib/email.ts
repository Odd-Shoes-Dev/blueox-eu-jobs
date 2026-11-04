// Stub — no email provider is wired up yet. This just logs to the function's
// console output so the verification/password-reset flows are testable end-to-end
// before a real provider exists.
//
// TODO: wire up Resend (https://resend.com/docs) here once the user sets it up.
// The signature below is deliberately provider-agnostic so swapping the body for a
// real `resend.emails.send(...)` call is the only change needed — no caller
// (api/auth/signup.ts, api/auth/request-password-reset.ts) needs to change.
export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  console.log(`[email stub] To: ${to}\nSubject: ${subject}\n\n${body}`);
}
