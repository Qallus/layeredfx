import 'server-only';
import {OperationError} from '@/lib/operations/engine.mjs';
import type {Actor} from '@/lib/operations/types';

// One-off staff email from the dashboard Quick Tools, sent through the same Resend account as booking emails.
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));

export const emailConfigured = () => Boolean(process.env.LFX_RESEND_API_KEY && process.env.LFX_EMAIL_FROM);

export type StaffEmail = {to: string; subject: string; text: string; requestId: string};

/** Validates the compose form; the request ID makes a retried send idempotent at the provider. */
export function staffEmailInput(body: Record<string, unknown>): StaffEmail {
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  if (to.length > 254 || !EMAIL.test(to)) throw new OperationError('Enter a valid recipient email address.');
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) throw new OperationError('Subject must be one line of 1–200 characters.');
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text || text.length > 10000) throw new OperationError('Message must contain 1–10,000 characters.');
  const requestId = typeof body.requestId === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(body.requestId) ? body.requestId : '';
  if (!requestId) throw new OperationError('A request ID is required.');
  return {to, subject, text, requestId};
}

export async function sendStaffEmail(email: StaffEmail, actor: Actor): Promise<{id: string | null}> {
  if (!emailConfigured()) throw new OperationError('Email is not configured for LayeredFX. No email was sent.', 503);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#19202e">${escapeHtml(email.text).replace(/\n/g, '<br/>')}</div>`;
  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${process.env.LFX_RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `lfx-staff-${actor.id}-${email.requestId}`},
      body: JSON.stringify({from: process.env.LFX_EMAIL_FROM, to: [email.to], subject: email.subject, text: email.text, html, ...(process.env.LFX_EMAIL_REPLY_TO ? {reply_to: process.env.LFX_EMAIL_REPLY_TO} : {})}),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new OperationError('The email provider did not respond. Check before retrying.', 502);
  }
  if (!response.ok) throw new OperationError('The email provider did not accept the message. No email was sent.', 502);
  const data = await response.json().catch(() => ({})) as {id?: string};
  return {id: typeof data.id === 'string' ? data.id : null};
}
