import 'server-only';
// Who may read pages through Lead Finder and enrichment, and how many pages a minute. Both routes share one budget.
import {OperationError} from '@/lib/operations/engine.mjs';
import {currentActor, mode} from '@/lib/operations/server';
import type {Actor} from '@/lib/operations/types';

const PAGES_PER_MINUTE = 60;
const attempts = new Map<string, {start: number; count: number}>();

/** Development demo has no sign-in; mode() is never 'demo' in production. */
export async function scrapeActor(): Promise<Actor> {
  const actor: Actor = mode() === 'demo' ? {id: 'demo_owner', name: 'Demo Owner', role: 'admin'} : await currentActor();
  if (actor.role === 'viewer') throw new OperationError('Reading web pages requires staff access.', 403);
  return actor;
}

export function scrapeThrottle(actor: Actor, pages = 1) {
  const now = Date.now();
  for (const [key, value] of attempts) if (now - value.start > 60000) attempts.delete(key);
  const bucket = attempts.get(actor.id) || {start: now, count: 0};
  if (bucket.count + pages > PAGES_PER_MINUTE) throw new OperationError('Please wait a minute before reading more pages.', 429);
  bucket.count += pages;
  attempts.set(actor.id, bucket);
}
