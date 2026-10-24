import 'server-only';
// Shared by the consent page and its form handler: who is approving, and whether the request is acceptable.
import {headers} from 'next/headers';
import {currentActor, mode} from '@/lib/operations/server';
import type {Actor} from '@/lib/operations/types';
import {getClient} from './store';
import {resourceUrl} from './http';
import {authorizeRequest} from './oauth.mjs';

export async function pageOrigin() {
  if (process.env.NODE_ENV !== 'development') return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://layeredfx.com').origin;
  const h = await headers();
  return `http://${h.get('host') || 'localhost:3000'}`;
}
/** The signed-in team member, or the status that stopped them (401 sign in, 403 not a member). */
export async function approver(): Promise<Actor | 401 | 403> {
  if (mode() === 'demo') return {id: 'demo_owner', name: 'Demo Owner', role: 'admin'};
  try { return await currentActor(); } catch (e) { return (e as {status?: number}).status === 403 ? 403 : 401; }
}
export async function checkRequest(params: Record<string, string>, origin: string) {
  const client = await getClient(params.client_id || '');
  return {client, check: authorizeRequest(params, client, resourceUrl(origin))};
}
export const PERMISSIONS = {
  read: ['Read contacts, leads, pipeline opportunities and installation jobs you can see'],
  write: ['Create and update contacts and leads, and log activity', 'Open opportunities, set next steps and move stages (stage rules still apply)', 'Read public websites to find and enrich leads'],
  never: 'It cannot send emails, texts or calls to customers, change team members, or bypass stage rules.',
};
