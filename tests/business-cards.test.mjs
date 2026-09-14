import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {applyCommand, emptyState} from '../lib/operations/engine.mjs';

const asModule = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const engineUrl = new URL('../lib/operations/engine.mjs', import.meta.url).href;
const securityUrl = new URL('../lib/operations/security.mjs', import.meta.url).href;
const compile = (path, replacements) => {
  let out = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText;
  for (const [from, to] of Object.entries(replacements)) out = out.replaceAll(from, to);
  return out;
};
const modelUrl = asModule(compile('../lib/business-cards/model.ts', {'@/lib/operations/engine.mjs': engineUrl}));
const model = await import(modelUrl);

const NOW = '2026-09-13T19:00:00.000Z';
const STAFF = {id: 'staff1', name: 'Sam Staff', role: 'staff', email: 'sam@example.test'};
const ADMIN = {id: 'admin1', name: 'Ada Admin', role: 'admin', email: 'ada@example.test'};
const OWNERS = [{id: 'staff1', name: 'Sam Staff', email: 'sam@example.test'}, {id: 'staff2', name: 'Kai Staff', email: 'kai@example.test'}];
const status = (fn, expected) => assert.throws(fn, e => e.status === expected);
const published = (over = {}) => ({...model.makeNewCard({id: 'staff1', name: 'Sam Staff'}), id: 'card1', slug: 'sam', status: 'published', ...over});

test('safeUrl allows web and contact schemes only', () => {
  assert.equal(model.safeUrl('javascript:alert(1)'), '');
  assert.equal(model.safeUrl('data:text/html,<script>1</script>'), '');
  assert.equal(model.safeUrl('example.com/path'), 'https://example.com/path');
  assert.equal(model.safeUrl('mailto:a@example.test'), '');
  assert.equal(model.safeUrl('mailto:a@example.test', ['mailto:']), 'mailto:a@example.test');
});

test('normalizeCard strips unsafe links, ignores client counters and keeps one of each section', () => {
  const card = model.normalizeCard({
    view_count: 999, share_count: 50,
    links: [{label: 'Bad', url: 'javascript:alert(1)'}, {label: 'Call', url: 'tel:+14805550123'}],
    sections: [{section_type: 'links', is_visible: true}, {section_type: 'links', is_visible: false}, {section_type: 'bogus'}],
    background_color: 'red; background:url(x)',
  }, null, {actor: STAFF, owners: OWNERS, now: NOW});
  assert.equal(card.view_count, 0);
  assert.equal(card.share_count, 0);
  assert.equal(card.links[0].url, '');
  assert.equal(card.links[1].url, 'tel:+14805550123');
  assert.equal(card.sections.length, 10);
  assert.equal(card.sections.filter(s => s.section_type === 'links').length, 1);
  assert.equal(card.sections.find(s => s.section_type === 'links').is_visible, true);
  assert.equal(card.background_color, '#202b28');
  assert.equal(card.owner_id, 'staff1');
});

test('only administrators can assign cards, and only to active members', () => {
  status(() => model.normalizeCard({owner_id: 'staff2'}, null, {actor: STAFF, owners: OWNERS, now: NOW}), 403);
  status(() => model.normalizeCard({owner_id: 'stranger'}, null, {actor: ADMIN, owners: OWNERS, now: NOW}), 400);
  assert.equal(model.normalizeCard({owner_id: 'staff2'}, null, {actor: ADMIN, owners: OWNERS, now: NOW}).owner_name, 'Kai Staff');
  status(() => model.requireCardWriter({...STAFF, role: 'viewer'}), 403);
  status(() => model.requireCardAccess(STAFF, {owner_id: 'staff2'}), 404);
  assert.doesNotThrow(() => model.requireCardAccess(ADMIN, {owner_id: 'staff2'}));
});

test('updates keep stored counters and publication history', () => {
  const existing = {...published({view_count: 12, click_count: 3, published_at: '2026-01-01T00:00:00.000Z', revision: 4})};
  const card = model.normalizeCard({view_count: 0, status: 'published', display_name: 'Sam'}, existing, {actor: STAFF, owners: OWNERS, now: NOW});
  assert.equal(card.view_count, 12);
  assert.equal(card.click_count, 3);
  assert.equal(card.published_at, '2026-01-01T00:00:00.000Z');
  assert.equal(card.revision, 4);
  const archived = model.normalizeCard({status: 'archived'}, existing, {actor: STAFF, owners: OWNERS, now: NOW});
  assert.equal(archived.archived_at, NOW);
});

test('slugs are validated and reserved words avoided', () => {
  status(() => model.normalizeCard({slug: 'admin'}, null, {actor: STAFF, owners: OWNERS, now: NOW}), 400);
  status(() => model.normalizeCard({slug: 'bad slug!'}, null, {actor: STAFF, owners: OWNERS, now: NOW}), 400);
  assert.equal(model.slugify('Jamie.Waters@layeredfx.com'), 'jamie-waters');
  assert.equal(model.candidateSlugs('admin')[0], 'admin-card');
});

test('public projection hides owner identity, automations and hidden links', () => {
  const card = published({owner_email: 'private@example.test', automations: [{id: 'a', trigger: 'lead_submit', action: 'notify_owner_sms', enabled: true}],
    links: [{id: 'l1', label: 'Hidden', url: 'https://example.test', link_type: 'custom', display_order: 1, is_visible: false, open_in_new_tab: true}]});
  const out = model.publicCard(card);
  assert.equal('owner_email' in out, false);
  assert.equal('automations' in out, false);
  assert.equal('revision' in out, false);
  assert.equal(out.links.length, 0);
  assert.equal(JSON.stringify(out).includes('private@example.test'), false);
});

test('lead input follows the card form settings', () => {
  status(() => model.normalizeLeadInput({name: 'Pat', email: 'pat@example.test'}, published({status: 'draft'})), 404);
  status(() => model.normalizeLeadInput({name: 'Pat'}, published()), 400);
  status(() => model.normalizeLeadInput({name: 'Pat', email: 'not-an-email'}, published()), 400);
  const values = model.normalizeLeadInput({name: ' Pat ', email: 'pat@example.test', company: 'Hidden field', message: 'Hello'}, published());
  assert.deepEqual(values, {name: 'Pat', email: 'pat@example.test', phone: '', company: '', message: 'Hello'});
});

test('vCard output escapes separators and line breaks', () => {
  const out = model.vcard(model.publicCard(published({display_name: 'Pat, Doe', first_name: 'Pat', last_name: 'Doe;Jr', company_name: 'LayeredFX', job_title: 'Line\nTwo'})), 'https://layeredfx.com/card/sam');
  assert.match(out, /FN:Pat\\, Doe\r\n/);
  assert.match(out, /N:Doe\\;Jr;Pat;;;/);
  assert.match(out, /TITLE:Line\\nTwo/);
  assert.match(out, /URL:https:\/\/layeredfx.com\/card\/sam\r\nEND:VCARD\r\n$/);
});

test('analytics only counts this card inside the range', () => {
  const now = Date.parse(NOW);
  const card = published({links: [{id: 'l1', label: 'Portfolio', url: 'https://example.test', link_type: 'custom', display_order: 1, is_visible: true, open_in_new_tab: true}]});
  const at = days => new Date(now - days * 86_400_000).toISOString();
  const events = [
    {id: '1', card_id: 'card1', link_id: null, event_type: 'view', source: 'organic', device_type: 'mobile', created_at: at(1)},
    {id: '2', card_id: 'card1', link_id: null, event_type: 'qr_scan', source: 'qr', device_type: 'mobile', created_at: at(2)},
    {id: '3', card_id: 'card1', link_id: 'l1', event_type: 'link_click', source: 'public_card', device_type: 'mobile', created_at: at(2)},
    {id: '4', card_id: 'card1', link_id: null, event_type: 'view', source: 'organic', device_type: 'mobile', created_at: at(40)},
    {id: '5', card_id: 'other', link_id: null, event_type: 'view', source: 'organic', device_type: 'mobile', created_at: at(1)},
  ];
  const result = model.summarizeAnalytics(events, card, 2, 30, now);
  assert.equal(result.views, 2);
  assert.equal(result.clicks, 1);
  assert.equal(result.leads, 2);
  assert.deepEqual(result.topLinks, [{label: 'Portfolio', count: 1}]);
  assert.equal(result.daily.length, 14);
  assert.equal(result.daily.reduce((n, d) => n + d.views, 0), 2);
  assert.deepEqual(model.cardStats([published({view_count: 5}), published({id: 'x', status: 'archived', view_count: 9})], [{card_id: 'card1', status: 'new'}, {card_id: 'x', status: 'new'}]).views, 5);
});

test('card lead conversion creates one lead, contact and opportunity even when repeated', () => {
  const state = emptyState();
  state.people = [ADMIN, STAFF];
  const cardLead = {id: 'cl1', cardId: 'card1', cardName: 'Sam', name: 'Pat Doe', email: 'pat@example.test', phone: '', company: 'Acme', message: 'Kitchen wall', createdAt: NOW};
  const first = applyCommand(state, {type: 'cardlead.import', cardLead, owner: 'staff1'}, ADMIN, NOW);
  assert.equal(first.state.leads.length, 1);
  assert.equal(first.state.leads[0].owner, 'staff1');
  assert.equal(first.state.leads[0].source, 'Business Card');
  const again = applyCommand(first.state, {type: 'cardlead.import', cardLead, owner: 'staff1'}, ADMIN, NOW);
  assert.equal(again.resultId, first.resultId);
  assert.equal(again.state.leads.length, 1);
  assert.equal(again.state.contacts.length, 1);
  const deal = applyCommand(again.state, {type: 'cardlead.pipeline', cardLead}, ADMIN, NOW);
  const repeat = applyCommand(deal.state, {type: 'cardlead.pipeline', cardLead}, ADMIN, NOW);
  assert.equal(repeat.resultId, deal.resultId);
  assert.equal(repeat.state.deals.length, 1);
  assert.match(repeat.state.deals[0].notes, /Business card lead cl1/);
  status(() => applyCommand(state, {type: 'cardlead.import', cardLead}, {...STAFF, role: 'viewer'}, NOW), 403);
  status(() => applyCommand(state, {type: 'cardlead.import', cardLead: {id: 'x', cardId: 'card1'}}, ADMIN, NOW), 400);
});

// Public route handlers with auth/storage boundaries replaced by fixtures.
const fixtures = asModule(`
import {readBody} from '${securityUrl}';
import {OperationError} from '${engineUrl}';
export const fx = {cards: new Map(), leads: [], events: [], sms: 0};
export function checkOrigin(r) { if (r.headers.get('origin') !== 'https://layeredfx.com') throw new OperationError('Origin denied', 403); }
export function errorResponse(e) { return Response.json({message: e.message}, {status: e.status || 500}); }
export async function readJsonObject(request, limit) {
  let body; try { body = JSON.parse(await readBody(request, limit)); } catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid JSON.', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new OperationError('A JSON object is required.', 400);
  return body;
}
export function throttle() { return true; }
export function cardRepository() { return {
  getCard: async id => fx.cards.get(id) ?? null,
  recordEvent: async e => { fx.events.push(e); },
  createLead: async l => { fx.leads.push(l); return l; },
}; }
export async function runLeadAutomations() { fx.sms++; }
`);
const {fx} = await import(fixtures);
const routeReplacements = {
  '@/lib/operations/server': fixtures, '@/lib/operations/engine.mjs': engineUrl, '@/lib/business-cards/model': modelUrl,
  '@/lib/business-cards/repository': fixtures, '@/lib/business-cards/notify': fixtures, '@/lib/business-cards/server': fixtures,
};
const leadsApi = await import(asModule(compile('../app/api/cards/leads/route.ts', routeReplacements)));
const eventsApi = await import(asModule(compile('../app/api/cards/events/route.ts', routeReplacements)));
const post = (api, body, origin = 'https://layeredfx.com') => api.POST(new Request('https://layeredfx.com/api/cards', {method: 'POST', headers: {origin, 'content-type': 'application/json'}, body: typeof body === 'string' ? body : JSON.stringify(body)}));
const validLead = {cardId: 'card1', name: 'Pat', email: 'pat@example.test', message: 'Hi'};

test.beforeEach(() => {
  fx.cards = new Map([['card1', published({owner_id: 'staff2', links: [{id: 'l1', label: 'Site', url: 'https://example.test', link_type: 'website', display_order: 1, is_visible: true, open_in_new_tab: true}]})], ['draft1', published({id: 'draft1', status: 'draft'})]]);
  fx.leads = []; fx.events = []; fx.sms = 0;
});

test('public lead capture rejects cross-origin, bots, drafts and oversized bodies before storage', async () => {
  assert.equal((await post(leadsApi, validLead, 'https://evil.example')).status, 403);
  assert.equal((await post(leadsApi, {...validLead, website: 'spam'})).status, 400);
  assert.equal((await post(leadsApi, {...validLead, cardId: 'draft1'})).status, 404);
  assert.equal((await post(leadsApi, {...validLead, cardId: 'missing'})).status, 404);
  assert.equal((await post(leadsApi, {cardId: 'card1', name: 'Pat'})).status, 400);
  assert.equal((await post(leadsApi, {...validLead, message: 'x'.repeat(17000)})).status, 413);
  assert.equal(fx.leads.length, 0);
  assert.equal(fx.sms, 0);
});

test('public lead capture stores the lead for the card owner, then records and notifies', async () => {
  const res = await post(leadsApi, {...validLead, owner_id: 'attacker', status: 'qualified'});
  assert.equal(res.status, 201);
  assert.equal(fx.leads.length, 1);
  assert.equal(fx.leads[0].owner_id, 'staff2');
  assert.equal(fx.leads[0].card_id, 'card1');
  assert.equal('status' in fx.leads[0], false);
  assert.equal(fx.events[0].event_type, 'lead_submit');
  assert.equal(fx.sms, 1);
});

test('public events accept interactions on published cards only', async () => {
  assert.equal((await post(eventsApi, {cardId: 'card1', eventType: 'view'})).status, 400);
  assert.equal((await post(eventsApi, {cardId: 'card1', eventType: 'lead_submit'})).status, 400);
  assert.equal((await post(eventsApi, {cardId: 'draft1', eventType: 'share'})).status, 404);
  assert.equal((await post(eventsApi, {cardId: 'card1', eventType: 'share'}, 'https://evil.example')).status, 403);
  assert.equal(fx.events.length, 0);
  assert.equal((await post(eventsApi, {cardId: 'card1', eventType: 'link_click', linkId: 'not-a-link'})).status, 200);
  assert.equal((await post(eventsApi, {cardId: 'card1', eventType: 'link_click', linkId: 'l1'})).status, 200);
  assert.deepEqual(fx.events.map(e => e.link_id), [null, 'l1']);
});
