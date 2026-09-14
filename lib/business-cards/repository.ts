import 'server-only';
// Business-card persistence. Channel Cast kept cards in a whole-collection JSONB CRM
// store; LayeredFX uses organization-scoped rows with compare-and-swap revisions
// (see docs/migration/sql/business-cards-review-draft.sql). Local development uses
// a file store under .local-data so the module works without LayeredFX credentials.
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {OperationError} from '@/lib/operations/engine.mjs';
import {configured, mode} from '@/lib/operations/server';
import {isUuid} from '@/lib/operations/security.mjs';
import {counterFor} from './model';
import type {BusinessCard, BusinessCardEvent, BusinessCardLead, EventType, LeadStatus} from './types';

export type NewEvent = Omit<BusinessCardEvent, 'id' | 'created_at'>;
export type NewLead = Omit<BusinessCardLead, 'id' | 'created_at' | 'revision' | 'status'>;

export interface CardRepository {
  listCards(ownerId?: string): Promise<BusinessCard[]>;
  getCard(id: string): Promise<BusinessCard | null>;
  getPublishedCard(slug: string): Promise<BusinessCard | null>;
  slugTaken(slug: string, exceptId?: string): Promise<boolean>;
  createCard(card: BusinessCard, actorId: string): Promise<BusinessCard>;
  updateCard(card: BusinessCard, expectedRevision: number, actorId: string): Promise<BusinessCard>;
  deleteCard(id: string, expectedRevision: number): Promise<void>;
  recordEvent(event: NewEvent): Promise<void>;
  events(cardId: string, sinceIso: string): Promise<BusinessCardEvent[]>;
  createLead(lead: NewLead): Promise<BusinessCardLead>;
  listLeads(ownerId?: string): Promise<BusinessCardLead[]>;
  getLead(id: string): Promise<BusinessCardLead | null>;
  updateLeadStatus(id: string, expectedRevision: number, status: LeadStatus): Promise<BusinessCardLead>;
  deleteLead(id: string, expectedRevision: number): Promise<void>;
}

const LIST_LIMIT = 500;
const stale = (what: string) => new OperationError(`This ${what} changed. Reload before saving again.`, 409);
const byUpdated = (a: {updated_at?: string; created_at: string}, b: {updated_at?: string; created_at: string}) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at);

// ── Local development store ─────────────────────────────────────────────────────

type DemoData = {cards: BusinessCard[]; leads: BusinessCardLead[]; events: BusinessCardEvent[]};
const demoFile = () => path.join(process.cwd(), '.local-data', 'business-cards', 'store.json');
let queue: Promise<unknown> = Promise.resolve();

async function readDemo(): Promise<DemoData> {
  try { return JSON.parse(await readFile(demoFile(), 'utf8')); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {cards: [], leads: [], events: []}; throw e; }
}
/** Serializes writes within this process and replaces the file atomically. */
function mutateDemo<T>(fn: (data: DemoData) => T): Promise<T> {
  const run = queue.then(async () => {
    const data = await readDemo();
    const result = fn(data);
    data.events = data.events.slice(-20000);
    await mkdir(path.dirname(demoFile()), {recursive: true});
    const tmp = `${demoFile()}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, demoFile());
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

const demoRepository: CardRepository = {
  listCards: async ownerId => (await readDemo()).cards.filter(c => !ownerId || c.owner_id === ownerId).sort(byUpdated).slice(0, LIST_LIMIT),
  getCard: async id => (await readDemo()).cards.find(c => c.id === id) ?? null,
  getPublishedCard: async slug => (await readDemo()).cards.find(c => c.slug === slug && c.status === 'published') ?? null,
  slugTaken: async (slug, exceptId) => (await readDemo()).cards.some(c => c.slug === slug && c.id !== exceptId),
  createCard: (card) => mutateDemo(data => {
    if (data.cards.some(c => c.slug === card.slug)) throw new OperationError('That public URL is already taken.', 409);
    const created = {...card, id: crypto.randomUUID(), revision: 0};
    data.cards.push(created);
    return created;
  }),
  updateCard: (card, expected) => mutateDemo(data => {
    const i = data.cards.findIndex(c => c.id === card.id);
    if (i < 0 || data.cards[i].revision !== expected) throw stale('card');
    if (data.cards.some(c => c.slug === card.slug && c.id !== card.id)) throw new OperationError('That public URL is already taken.', 409);
    const current = data.cards[i];
    // Counters belong to event recording; a save never rolls them back.
    const updated = {...card, revision: expected + 1, view_count: current.view_count, click_count: current.click_count, share_count: current.share_count, save_count: current.save_count};
    data.cards[i] = updated;
    return updated;
  }),
  deleteCard: (id, expected) => mutateDemo(data => {
    const card = data.cards.find(c => c.id === id);
    if (!card || card.revision !== expected) throw stale('card');
    if (data.leads.some(l => l.card_id === id)) throw new OperationError('This card has captured leads. Archive it instead so the lead history is kept.', 409);
    data.cards = data.cards.filter(c => c.id !== id);
    data.events = data.events.filter(e => e.card_id !== id);
  }),
  recordEvent: event => mutateDemo(data => {
    const card = data.cards.find(c => c.id === event.card_id);
    if (!card) return;
    data.events.push({...event, id: crypto.randomUUID(), created_at: new Date().toISOString()});
    const counter = counterFor(event.event_type as EventType);
    if (counter) card[counter]++;
  }),
  events: async (cardId, since) => (await readDemo()).events.filter(e => e.card_id === cardId && e.created_at >= since),
  createLead: lead => mutateDemo(data => {
    const created: BusinessCardLead = {...lead, id: crypto.randomUUID(), status: 'new', revision: 0, created_at: new Date().toISOString()};
    data.leads.push(created);
    return created;
  }),
  listLeads: async ownerId => (await readDemo()).leads.filter(l => !ownerId || l.owner_id === ownerId).sort(byUpdated).slice(0, LIST_LIMIT),
  getLead: async id => (await readDemo()).leads.find(l => l.id === id) ?? null,
  updateLeadStatus: (id, expected, status) => mutateDemo(data => {
    const lead = data.leads.find(l => l.id === id);
    if (!lead || lead.revision !== expected) throw stale('lead');
    Object.assign(lead, {status, revision: expected + 1});
    return lead;
  }),
  deleteLead: (id, expected) => mutateDemo(data => {
    const lead = data.leads.find(l => l.id === id);
    if (!lead || lead.revision !== expected) throw stale('lead');
    data.leads = data.leads.filter(l => l.id !== id);
  }),
};

// ── LayeredFX Supabase store ─────────────────────────────────────────────────────

type CardRow = {id: string; owner_id: string | null; slug: string; status: BusinessCard['status']; revision: number; view_count: number; click_count: number; share_count: number; save_count: number; card: BusinessCard; created_at: string; updated_at: string};
const CARD_COLUMNS = 'id,owner_id,slug,status,revision,view_count,click_count,share_count,save_count,card,created_at,updated_at';
const LEAD_COLUMNS = 'id,card_id,owner_id,card_name,name,email,phone,company,message,source,status,revision,created_at';
// Columns are authoritative; the JSON document carries the editable presentation fields.
const fromRow = (r: CardRow): BusinessCard => ({...r.card, id: r.id, owner_id: r.owner_id, slug: r.slug, status: r.status, revision: Number(r.revision), view_count: Number(r.view_count), click_count: Number(r.click_count), share_count: Number(r.share_count), save_count: Number(r.save_count), created_at: r.created_at, updated_at: r.updated_at});
const document = (card: BusinessCard) => {
  const {id: _i, owner_id: _o, slug: _s, status: _st, revision: _r, view_count: _v, click_count: _c, share_count: _sh, save_count: _sa, created_at: _cr, updated_at: _u, ...rest} = card;
  void _i; void _o; void _s; void _st; void _r; void _v; void _c; void _sh; void _sa; void _cr; void _u;
  return rest;
};

function supabaseRepository(): CardRepository {
  const org = process.env.LFX_OPERATIONS_ORG_ID;
  if (!configured() || !isUuid(org)) throw new OperationError('LayeredFX business-card storage requires configuration.', 503);
  const origin = new URL(process.env.LFX_SUPABASE_URL!);
  if (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new OperationError('LayeredFX storage requires HTTPS.', 503);
  const key = process.env.LFX_SUPABASE_SERVICE_ROLE_KEY!;
  async function rest<T>(table: string, params: Record<string, string>, init: RequestInit = {}): Promise<T> {
    const search = new URLSearchParams({...params, org_id: `eq.${org}`});
    const response = await fetch(`${origin.origin}/rest/v1/${table}?${search}`, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(12000),
      headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...init.headers},
    });
    if (response.status === 409) throw new OperationError(table === 'lfx_business_cards' ? 'That public URL is taken, or the card still has leads. Archive cards with lead history instead of deleting them.' : 'This record is referenced by another record.', 409);
    if (!response.ok) throw new OperationError('Business-card storage is unavailable. The LayeredFX business-card schema must be configured.', 503);
    return response.status === 204 ? (undefined as T) : response.json();
  }
  const id = (value: string) => { if (!isUuid(value)) throw new OperationError('Record not found.', 404); return `eq.${value}`; };
  const owner = (ownerId?: string): Record<string, string> => ownerId ? {owner_id: `eq.${ownerId}`} : {};
  return {
    listCards: async ownerId => (await rest<CardRow[]>('lfx_business_cards', {select: CARD_COLUMNS, order: 'updated_at.desc', limit: String(LIST_LIMIT), ...owner(ownerId)})).map(fromRow),
    getCard: async cardId => { if (!isUuid(cardId)) return null; const rows = await rest<CardRow[]>('lfx_business_cards', {select: CARD_COLUMNS, id: id(cardId)}); return rows[0] ? fromRow(rows[0]) : null; },
    getPublishedCard: async slug => { const rows = await rest<CardRow[]>('lfx_business_cards', {select: CARD_COLUMNS, slug: `eq.${slug}`, status: 'eq.published'}); return rows[0] ? fromRow(rows[0]) : null; },
    slugTaken: async (slug, exceptId) => (await rest<{id: string}[]>('lfx_business_cards', {select: 'id', slug: `eq.${slug}`})).some(r => r.id !== exceptId),
    createCard: async (card, actorId) => fromRow((await rest<CardRow[]>('lfx_business_cards', {select: CARD_COLUMNS}, {method: 'POST', body: JSON.stringify({org_id: org, owner_id: card.owner_id, slug: card.slug, status: card.status, card: document(card), changed_by: actorId})}))[0]),
    updateCard: async (card, expected, actorId) => {
      const rows = await rest<CardRow[]>('lfx_business_cards', {select: CARD_COLUMNS, id: id(card.id), revision: `eq.${expected}`}, {method: 'PATCH', body: JSON.stringify({owner_id: card.owner_id, slug: card.slug, status: card.status, card: document(card), revision: expected + 1, updated_at: card.updated_at, changed_by: actorId})});
      if (!rows.length) throw stale('card');
      return fromRow(rows[0]);
    },
    deleteCard: async (cardId, expected) => {
      const rows = await rest<{id: string}[]>('lfx_business_cards', {select: 'id', id: id(cardId), revision: `eq.${expected}`}, {method: 'DELETE'});
      if (!rows.length) throw stale('card');
    },
    recordEvent: async event => {
      // Atomic insert + counter increment in one statement; see lfx_record_card_event.
      const response = await fetch(`${origin.origin}/rest/v1/rpc/lfx_record_card_event`, {
        method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
        headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({p_org: org, p_card: event.card_id, p_type: event.event_type, p_link: event.link_id, p_source: event.source, p_device: event.device_type}),
      });
      if (!response.ok) throw new OperationError('Card analytics storage is unavailable.', 503);
    },
    events: async (cardId, since) => rest<BusinessCardEvent[]>('lfx_card_events', {select: 'id,card_id,link_id,event_type,source,device_type,created_at', card_id: id(cardId), created_at: `gte.${since}`, order: 'created_at.asc', limit: '50000'}),
    createLead: async lead => (await rest<BusinessCardLead[]>('lfx_card_leads', {select: LEAD_COLUMNS}, {method: 'POST', body: JSON.stringify({...lead, org_id: org})}))[0],
    listLeads: async ownerId => rest<BusinessCardLead[]>('lfx_card_leads', {select: LEAD_COLUMNS, order: 'created_at.desc', limit: String(LIST_LIMIT), ...owner(ownerId)}),
    getLead: async leadId => { if (!isUuid(leadId)) return null; return (await rest<BusinessCardLead[]>('lfx_card_leads', {select: LEAD_COLUMNS, id: id(leadId)}))[0] ?? null; },
    updateLeadStatus: async (leadId, expected, status) => {
      const rows = await rest<BusinessCardLead[]>('lfx_card_leads', {select: LEAD_COLUMNS, id: id(leadId), revision: `eq.${expected}`}, {method: 'PATCH', body: JSON.stringify({status, revision: expected + 1})});
      if (!rows.length) throw stale('lead');
      return rows[0];
    },
    deleteLead: async (leadId, expected) => {
      const rows = await rest<{id: string}[]>('lfx_card_leads', {select: 'id', id: id(leadId), revision: `eq.${expected}`}, {method: 'DELETE'});
      if (!rows.length) throw stale('lead');
    },
  };
}

export function cardRepository(): CardRepository {
  return mode() === 'demo' ? demoRepository : supabaseRepository();
}
