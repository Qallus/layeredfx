import 'server-only';
// Access boundary for business cards. Demo identities exist only when mode() is
// 'demo' (local development); production always requires an active member.
import {currentActor, mode, people} from '@/lib/operations/server';
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import type {Actor} from '@/lib/operations/types';
import {candidateSlugs} from './model';
import type {CardRepository} from './repository';
import type {BusinessCard, OwnerOption} from './types';

export async function readJsonObject(request: Request, limit: number): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new OperationError('JSON is required.', 415);
  let body: unknown;
  try { body = JSON.parse(await readBody(request, limit)); }
  catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid JSON.', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new OperationError('A JSON object is required.', 400);
  return body as Record<string, unknown>;
}

/**
 * Keeps an existing public URL unless the editor chose a new one, because printed QR
 * codes and written NFC items point at it. Blank slugs on new cards are generated.
 */
export async function resolveSlug(repo: CardRepository, card: BusinessCard, existing: BusinessCard | null): Promise<string> {
  if (card.slug) {
    if (await repo.slugTaken(card.slug, card.id || undefined)) throw new OperationError('That public URL is already taken. Choose another.', 409);
    return card.slug;
  }
  if (existing?.slug) return existing.slug;
  for (const slug of candidateSlugs(card.display_name || card.card_name)) if (!(await repo.slugTaken(slug))) return slug;
  throw new OperationError('Choose a public URL for this card.', 409);
}

const DEMO_ACTOR: Actor = {id: 'demo_owner', name: 'Demo Owner', role: 'admin', email: 'owner@example.test'};
const DEMO_OWNERS: OwnerOption[] = [
  {id: 'demo_owner', name: 'Demo Owner', email: 'owner@example.test'},
  {id: 'demo_staff', name: 'Demo Installer', email: 'installer@example.test'},
];

export async function cardActor(): Promise<Actor> {
  return mode() === 'demo' ? DEMO_ACTOR : currentActor();
}

/** Active members who can own a card. Read-only members cannot own cards. */
export async function ownerOptions(): Promise<OwnerOption[]> {
  if (mode() === 'demo') return DEMO_OWNERS;
  return (await people()).filter(p => p.role !== 'viewer').map(p => ({id: p.id, name: p.name || p.email || 'Member', email: p.email || null})).sort((a, b) => a.name.localeCompare(b.name));
}

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://layeredfx.com';
}

export const privateHeaders = {'Cache-Control': 'private, no-store', Vary: 'Cookie'};

const buckets = new Map<string, {at: number; count: number}>();
/** Best-effort per-instance throttle for anonymous public endpoints. */
export function throttle(request: Request, scope: string, limit: number) {
  const key = `${scope}:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'}`;
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.at > 60_000) buckets.delete(k);
  const prior = buckets.get(key);
  if (!prior || now - prior.at > 60_000) { buckets.set(key, {at: now, count: 1}); return true; }
  prior.count++;
  return prior.count <= limit;
}
