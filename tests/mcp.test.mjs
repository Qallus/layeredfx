import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {applyCommand, emptyState, visibleState} from '../lib/operations/engine.mjs';
import {allowedRedirect, authorizeRequest, hashSecret, newSecret, registration, verifyPkce} from '../lib/mcp/oauth.mjs';

const HOSTS = ['claude.ai', 'claude.com'];

test('PKCE S256 matches the RFC 7636 example and rejects anything else', () => {
  assert.equal(verifyPkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'), true);
  assert.equal(verifyPkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXX', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'), false);
  assert.equal(verifyPkce('short', 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'), false);
  assert.equal(verifyPkce(undefined, ''), false);
});

test('secrets are random, prefixed, and stored only as hashes', () => {
  const a = newSecret('lfx_at'), b = newSecret('lfx_at');
  assert.match(a, /^lfx_at_[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, b);
  assert.match(hashSecret(a), /^[0-9a-f]{64}$/);
  assert.equal(hashSecret(a), hashSecret(a));
});

test('redirects: Claude hosts over https and local loopback only', () => {
  for (const ok of ['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback', 'https://app.claude.ai/cb', 'http://localhost:33418/callback', 'http://127.0.0.1:5000/cb'])
    assert.equal(allowedRedirect(ok, HOSTS), true, ok);
  for (const bad of ['http://claude.ai/cb', 'https://claude.ai.evil.com/cb', 'https://evilclaude.ai/cb', 'https://evil.com/cb', 'https://claude.ai/cb#x', 'https://u:p@claude.ai/cb', 'javascript:alert(1)', 'http://192.168.1.5/cb'])
    assert.equal(allowedRedirect(bad, HOSTS), false, bad);
});

test('registration accepts public PKCE clients with allowed redirects only', () => {
  assert.deepEqual(registration({client_name: 'Claude', redirect_uris: ['https://claude.ai/api/mcp/auth_callback']}, HOSTS), {client: {name: 'Claude', redirectUris: ['https://claude.ai/api/mcp/auth_callback']}});
  assert.equal(registration({redirect_uris: ['https://evil.com/cb']}, HOSTS).error, 'invalid_redirect_uri');
  assert.equal(registration({redirect_uris: []}, HOSTS).error, 'invalid_redirect_uri');
  assert.equal(registration({redirect_uris: ['https://claude.ai/cb'], token_endpoint_auth_method: 'client_secret_basic'}, HOSTS).error, 'invalid_client_metadata');
});

test('authorization requests: unknown clients and mismatched redirects stop before any redirect', () => {
  const client = {id: 'mcp_1', name: 'Claude', redirectUris: ['https://claude.ai/cb']};
  const base = {response_type: 'code', client_id: 'mcp_1', redirect_uri: 'https://claude.ai/cb', code_challenge: 'abc', code_challenge_method: 'S256', state: 's1'};
  assert.ok('fatal' in authorizeRequest(base, null, 'https://layeredfx.com/api/mcp'));
  assert.ok('fatal' in authorizeRequest({...base, redirect_uri: 'https://claude.ai/other'}, client, 'https://layeredfx.com/api/mcp'));
  assert.equal(authorizeRequest({...base, code_challenge_method: 'plain'}, client, 'https://layeredfx.com/api/mcp').error, 'invalid_request');
  assert.equal(authorizeRequest({...base, resource: 'https://other.com/mcp'}, client, 'https://layeredfx.com/api/mcp').error, 'invalid_target');
  assert.equal(authorizeRequest({...base, scope: 'admin'}, client, 'https://layeredfx.com/api/mcp').error, 'invalid_scope');
  assert.deepEqual(authorizeRequest({...base, resource: 'https://layeredfx.com/api/mcp/', scope: 'lfx'}, client, 'https://layeredfx.com/api/mcp').ok, {clientId: 'mcp_1', redirect: 'https://claude.ai/cb', state: 's1', challenge: 'abc'});
});

// Tools and protocol, running the real engine with only state storage and the web service replaced.
const dataUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const lib = path => new URL(`../lib/${path}`, import.meta.url).href;
const boundary = dataUrl(`
import {applyCommand,visibleState,OperationError} from '${lib('operations/engine.mjs')}';
export const fixture={state:null,web:[]};
export async function loadState(actor){return visibleState(fixture.state,actor);}
export async function applyAs(actor,command){const r=applyCommand(fixture.state,command,actor,'2026-10-23T17:00:00.000Z');fixture.state=r.state;return {state:visibleState(r.state,actor),resultId:r.resultId};}
export function grokReady(){return false;}
export async function findLeads(actor,input){fixture.web.push(['find',input]);return {url:input.url,title:'Directory',method:'built-in',leads:[]};}
export async function enrichSite(actor,contact,ai){fixture.web.push(['enrich',contact.name]);return {site:'https://acme.com/',pages:['https://acme.com/','https://acme.com/contact'],method:'built-in',profile:{company:'Acme Wraps LLC',title:'',email:'info@acme.com',phone:'480-555-0100',website:'https://acme.com/',address:'',city:'Mesa',state:'AZ',zip:'',description:'Wall wraps.',services:'',socials:{instagram:'https://instagram.com/acme'},people:[]}};}
`);
const transpile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText
  .replaceAll("import 'server-only';", '').replaceAll("'./state'", `'${boundary}'`).replaceAll('@/lib/scraper/service', boundary)
  .replaceAll('@/lib/operations/engine.mjs', lib('operations/engine.mjs')).replaceAll('@/lib/operations/defaults.mjs', lib('operations/defaults.mjs'))
  .replaceAll('@/lib/operations/contacts.mjs', lib('operations/contacts.mjs')).replaceAll('@/lib/operations/jobs.mjs', lib('operations/jobs.mjs')).replaceAll('@/lib/scraper/extract.mjs', lib('scraper/extract.mjs'));
const {fixture} = await import(boundary);
const {toolsFor} = await import(dataUrl(transpile('../lib/mcp/tools.ts')));
const {handleMessage} = await import(dataUrl(transpile('../lib/mcp/protocol.ts')));

const ADMIN = {id: 'admin', name: 'Admin', role: 'admin'}, STAFF = {id: 'staff', name: 'Sam Staff', role: 'staff'}, VIEWER = {id: 'viewer', name: 'Vic Viewer', role: 'viewer'};
function seed() {
  let s = Object.assign(emptyState(), {people: [ADMIN, STAFF, VIEWER]});
  s = applyCommand(s, {type: 'contact.save', patch: {name: 'Pat Doe', company: 'Acme', email: 'pat@acme.com', phone: '', type: 'lead'}}, STAFF).state;
  fixture.state = s; fixture.web = [];
}
let nextId = 1;
const call = async (actor, name, args = {}) => {
  const reply = await handleMessage({jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: {name, arguments: args}}, actor, toolsFor(actor));
  const text = reply.result.content[0].text;
  return {isError: reply.result.isError, text, data: reply.result.isError ? null : JSON.parse(text)};
};
test.beforeEach(seed);

test('initialize negotiates the protocol version and announces tools only', async () => {
  const r = await handleMessage({jsonrpc: '2.0', id: 1, method: 'initialize', params: {protocolVersion: '2025-06-18'}}, STAFF, toolsFor(STAFF));
  assert.equal(r.result.protocolVersion, '2025-06-18');
  assert.deepEqual(r.result.capabilities, {tools: {listChanged: false}});
  assert.match(r.result.instructions, /does not|Nothing here sends/);
  const future = await handleMessage({jsonrpc: '2.0', id: 2, method: 'initialize', params: {protocolVersion: '2099-01-01'}}, STAFF, toolsFor(STAFF));
  assert.equal(future.result.protocolVersion, '2025-11-25');
  assert.equal(await handleMessage({jsonrpc: '2.0', method: 'notifications/initialized'}, STAFF, toolsFor(STAFF)), null);
  assert.equal((await handleMessage({jsonrpc: '2.0', id: 3, method: 'resources/list'}, STAFF, toolsFor(STAFF))).error.code, -32601);
  assert.equal((await handleMessage({id: 4, method: 'ping'}, STAFF, toolsFor(STAFF))).error.code, -32600);
});

test('viewers get read tools only; no tool can send messages', async () => {
  const names = actor => toolsFor(actor).map(t => t.name);
  assert.deepEqual(names(VIEWER), ['get_overview', 'search_contacts', 'get_contact', 'list_opportunities', 'get_opportunity', 'list_pipeline_stages', 'list_jobs']);
  assert.equal(names(STAFF).length, 16);
  assert.ok(!names(ADMIN).some(n => /send|sms|email|call_/.test(n)));
  const list = await handleMessage({jsonrpc: '2.0', id: 9, method: 'tools/list'}, VIEWER, toolsFor(VIEWER));
  assert.ok(list.result.tools.every(t => t.annotations.readOnlyHint));
  const blocked = await handleMessage({jsonrpc: '2.0', id: 10, method: 'tools/call', params: {name: 'save_contact', arguments: {name: 'X'}}}, VIEWER, toolsFor(VIEWER));
  assert.equal(blocked.error.code, -32602);
});

test('contacts: search, create, and duplicate-safe lead import', async () => {
  assert.equal((await call(STAFF, 'search_contacts', {query: 'acme'})).data.contacts[0].name, 'Pat Doe');
  const created = await call(STAFF, 'save_contact', {name: 'Jo Lee', company: 'Lee Design', email: 'jo@leedesign.com', category: 'prospect'});
  assert.equal(created.data.saved.category, 'prospect');
  assert.equal(created.data.saved.source, 'Claude');
  const imported = await call(STAFF, 'import_leads', {leads: [{name: 'Pat Again', email: 'PAT@acme.com'}, {company: 'New Co', phone: '480-555-0111', sourceUrl: 'https://dir.example.com/p1'}, {company: 'New Co Copy', phone: '(480) 555-0111'}, {notes: 'nothing'}], tags: ['directory']});
  assert.equal(imported.data.imported, 1);
  assert.deepEqual(imported.data.importedNames, ['New Co']);
  assert.deepEqual(imported.data.skipped.map(x => x.reason), ['Already a contact.', 'Duplicate within this list.', 'No name, email or phone.']);
  const newCo = fixture.state.contacts.find(c => c.name === 'New Co');
  assert.deepEqual([newCo.type, newCo.owner, newCo.tags, newCo.source], ['lead', 'staff', ['directory'], 'Lead Finder · dir.example.com']);
  assert.ok(fixture.state.leads.some(l => l.contactId === newCo.id), 'importing as lead also creates the Lead record');
});

test('pipeline: stage rules are enforced and reported, not bypassed', async () => {
  const contact = fixture.state.contacts[0];
  const opened = await call(STAFF, 'add_to_pipeline', {contactId: contact.id, value: 4200});
  const id = opened.data.opportunity.id;
  assert.equal(opened.data.opportunity.stage, 'new_working');
  const lost = await call(STAFF, 'move_opportunity_stage', {id, stage: 'closed_lost'});
  assert.equal(lost.isError, true);
  assert.match(lost.text, /lost reason/i);
  const skip = await call(STAFF, 'move_opportunity_stage', {id, stage: 'proposal'});
  assert.equal(skip.isError, true);
  assert.match(skip.text, /Complete required steps/);
  assert.equal((await call(STAFF, 'move_opportunity_stage', {id, stage: 'closed_lost', lostReason: 'Timing'})).data.opportunity.stage, 'closed_lost');
  const next = await call(STAFF, 'set_next_step', {id, action: 'Call back in spring', dueDate: '2027-03-01', stepType: 'call'});
  assert.equal(next.data.opportunity.nextStep.action, 'Call back in spring');
  await call(STAFF, 'log_opportunity_activity', {id, kind: 'note', body: 'Prefers matte finishes.'});
  const detail = await call(VIEWER, 'get_opportunity', {id});
  assert.ok(detail.data.activity.some(a => a.body === 'Prefers matte finishes.' && a.by === 'Sam Staff'));
});

test('enrichment proposes by default and fill_blanks never replaces existing values', async () => {
  const contact = fixture.state.contacts[0];
  const proposed = await call(STAFF, 'enrich_contact', {id: contact.id});
  assert.equal(proposed.data.applied, false);
  assert.equal(fixture.state.contacts[0].city, undefined);
  const applied = await call(STAFF, 'enrich_contact', {id: contact.id, apply: 'fill_blanks'});
  assert.deepEqual(applied.data.filled, ['phone', 'website', 'city', 'state']);
  assert.deepEqual(applied.data.notReplaced.map(x => x.field), ['company', 'email']);
  const saved = fixture.state.contacts[0];
  assert.deepEqual([saved.company, saved.email, saved.phone, saved.city], ['Acme', 'pat@acme.com', '480-555-0100', 'Mesa']);
  assert.equal(saved.details.social_instagram, 'https://instagram.com/acme');
  assert.match(fixture.state.contactActivities.at(-1).body, /^Enriched by Claude from https:\/\/acme\.com\//);
});

test('tool failures are returned as tool errors with readable messages', async () => {
  assert.match((await call(STAFF, 'get_contact', {id: 'nope'})).text, /Contact not found/);
  assert.match((await call(STAFF, 'log_contact_activity', {contactId: fixture.state.contacts[0].id, kind: 'fax', body: 'x'})).text, /Invalid activity type/);
  assert.match((await call(STAFF, 'save_contact', {})).text, /name is required/);
  const overview = await call(VIEWER, 'get_overview');
  assert.equal(overview.data.contacts.leads, 1);
  assert.equal(visibleState(fixture.state, VIEWER).contacts.length, 1);
});
