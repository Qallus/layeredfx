import 'server-only';
// Lead-submit automations, adapted from Channel Cast lib/business-cards/notify.ts.
// LayeredFX has no email provider, so email rules are stored but never sent. Owner
// SMS uses the LayeredFX Twilio configuration when it exists. Never throws into the
// public lead-capture path; demo mode never contacts a provider.
import {mode} from '@/lib/operations/server';
import {capabilities, twilioClient} from '@/lib/communications/twilio';
import {cardName} from './model';
import type {BusinessCard} from './types';

export const automationSupport = () => ({email: false, sms: mode() !== 'demo' && capabilities().sms});

export async function runLeadAutomations(card: BusinessCard, lead: {name: string; email: string; phone: string; message: string}): Promise<void> {
  if (!automationSupport().sms) return;
  const rule = card.automations.find(a => a.enabled && a.trigger === 'lead_submit' && a.action === 'notify_owner_sms');
  const to = (card.sms_phone || card.primary_phone).replace(/[^\d+]/g, '');
  if (!rule || !/^\+[1-9]\d{7,14}$/.test(to)) return;
  try {
    await twilioClient().messages.create({
      to, from: capabilities().from,
      body: `New LayeredFX card lead on ${cardName(card)}: ${lead.name || lead.email || lead.phone || 'someone'}${lead.message ? ` — ${lead.message.slice(0, 100)}` : ''}`,
    });
  } catch {
    // The lead is already stored; notification failure must not fail the visitor.
  }
}
