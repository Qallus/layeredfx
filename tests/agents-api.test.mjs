import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {applyCommand, emptyState, OperationError} from '../lib/operations/engine.mjs';

const dataUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const engine = new URL('../lib/operations/engine.mjs', import.meta.url).href;
const security = new URL('../lib/operations/security.mjs', import.meta.url).href;
const NOW = '2026-09-15T17:00:00.000Z';
const ADMIN = {id: 'admin', name: 'Admin', role: 'admin', email: 'admin@example.test'};
const STAFF = {id: 'staff', name: 'Staff', role: 'staff', email: 'staff@example.test'};

const boundary = dataUrl(`
import {OperationError} from '${engine}';
export const fixture={role:'admin',mode:'supabase',state:null,writes:[],sends:[],fail:null,checks:[{name:'Service',ok:true,detail:'Hermes answered.'}]};
export function checkOrigin(request){if(request.headers.get('origin')!=='https://layeredfx.com')throw new OperationError('This request origin is not allowed.',403);}
export async function currentActor(){return fixture.role==='admin'?{id:'admin',name:'Admin',role:'admin'}:{id:'staff',name:'Staff',role:fixture.role};}
export function errorResponse(error){return Response.json({message:error.message},{status:error.status||500});}
export function mode(){return fixture.mode;}
export async function readState(){return structuredClone(fixture.state);}
export async function writeState(state,revision){fixture.writes.push(revision);fixture.state=state;}
export async function hermesChat(input){fixture.sends.push({service:'hermes',input});if(fixture.fail)throw fixture.fail;return {id:'resp_1',text:'Here is a draft reply.',model:'eve'};}
export async function paperclipCreateIssue(input){fixture.sends.push({service:'paperclip',input});if(fixture.fail)throw fixture.fail;return {id:'PC-12',url:'https://team.layeredfx.com/issues/PC-12',confirmed:true};}
export async function paperclipAgents(){return [{id:'a1',name:'Writer'}];}
export async function hermesHealth(){return fixture.checks;}
export async function paperclipHealth(){return fixture.checks;}
export function agentThrottle(){}
export function agentFailure(error){return error;}
`);
const {fixture} = await import(boundary);
let code = ts.transpileModule(readFileSync(new URL('../app/api/agents/[action]/route.ts', import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText;
// Replace the bare specifier so the quotes around it stay in place.
code = code.replaceAll('@/lib/operations/engine.mjs', engine).replaceAll('@/lib/operations/security.mjs', security)
  .replaceAll('@/lib/operations/server', boundary).replaceAll('@/lib/agents/client', boundary);
const api = await import(dataUrl(code));

function seed(agent = 'paperclip', actor = ADMIN) {
  const base = Object.assign(emptyState(), {people: [ADMIN, STAFF]});
  const result = applyCommand(base, {type: 'agent.assign', patch: {title: 'Draft review replies', agent, details: 'Reply to this week reviews.', priority: 'high'}}, actor, NOW);
  fixture.state = result.state;
  return result.resultId;
}
const send = (action, body, {origin = 'https://layeredfx.com', type = 'application/json'} = {}) =>
  api.POST(new Request(`https://layeredfx.com/api/agents/${action}`, {method: 'POST', headers: {origin, 'content-type': type}, body: JSON.stringify(body)}), {params: Promise.resolve({action})});
const assignment = () => fixture.state.agentAssignments[0];
test.beforeEach(() => Object.assign(fixture, {role: 'admin', mode: 'supabase', writes: [], sends: [], fail: null, checks: [{name: 'Service', ok: true, detail: 'Hermes answered.'}]}));

test('sending requires the LayeredFX origin, a signed-in writer and JSON', async () => {
  const id = seed();
  assert.equal((await send('send', {id}, {origin: 'https://evil.test'})).status, 403);
  fixture.role = 'viewer';
  assert.equal((await send('send', {id})).status, 403);
  fixture.role = 'admin';
  assert.equal((await send('send', {id}, {type: 'text/plain'})).status, 415);
  assert.equal(fixture.sends.length, 0);
});

test('the local demo never reaches a provider', async () => {
  const id = seed();
  fixture.mode = 'demo';
  const response = await send('send', {id});
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /demo/i);
  assert.equal(fixture.sends.length, 0);
});

test('a Paperclip assignment becomes a task and records what came back', async () => {
  const id = seed('paperclip');
  const response = await send('send', {id});
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(data.message, /PC-12/);
  assert.equal(data.confirmed, true);
  assert.equal(fixture.sends[0].service, 'paperclip');
  // The prompt is built from stored state, not from the request body.
  assert.match(fixture.sends[0].input.description, /Reply to this week reviews\./);
  assert.match(fixture.sends[0].input.marker, /^lfx-/);
  const item = assignment();
  assert.equal(item.delivery.state, 'sent');
  assert.equal(item.delivery.externalId, 'PC-12');
  assert.equal(item.delivery.attempts, 1);
  assert.equal(item.status, 'in_progress');
  assert.equal(fixture.writes.length, 1, 'one compare-and-swap write');
});

test('an Eve reply is kept in the assignment history', async () => {
  const id = seed('eve');
  const response = await send('send', {id});
  assert.equal(response.status, 200);
  assert.equal(fixture.sends[0].service, 'hermes');
  const item = assignment();
  assert.equal(item.delivery.service, 'hermes');
  assert.match(item.log.at(-1).text, /Here is a draft reply\./);
});

test('a provider failure is recorded and reported without losing the queued work', async () => {
  const id = seed('paperclip');
  // The client throws OperationError; an unexpected error type is deliberately reported generically instead.
  fixture.fail = new OperationError('Paperclip did not confirm the request (HTTP 500). Check before sending again.', 502);
  const response = await send('send', {id});
  assert.equal(response.status, 502);
  const item = assignment();
  assert.equal(item.delivery.state, 'failed');
  assert.equal(item.delivery.attempts, 1);
  assert.match(item.delivery.lastError, /HTTP 500/);
  assert.equal(item.status, 'queued', 'still queued so it can be sent again');
  // A second attempt is allowed and counts up.
  fixture.fail = null;
  assert.equal((await send('send', {id})).status, 200);
  assert.equal(assignment().delivery.attempts, 2);
});

test('closed, already sent, voice and unknown assignments are refused', async () => {
  const id = seed('voice');
  assert.equal((await send('send', {id})).status, 400);
  assert.equal((await send('send', {id: 'assign_missing'})).status, 404);
  assert.equal(fixture.sends.length, 0);
  const other = seed('paperclip');
  await send('send', {id: other});
  const repeat = await send('send', {id: other});
  assert.equal(repeat.status, 409);
  assert.match((await repeat.json()).message, /already sent/i);
});

test('staff may only send their own assignments', async () => {
  const id = seed('paperclip', ADMIN);
  fixture.role = 'staff';
  assert.equal((await send('send', {id})).status, 403);
  assert.equal(fixture.sends.length, 0);
});

test('only administrators test connections, and no key or body is returned', async () => {
  seed();
  fixture.role = 'staff';
  assert.equal((await send('verify', {service: 'eve'})).status, 403);
  fixture.role = 'admin';
  assert.equal((await send('verify', {service: 'nope'})).status, 400);
  const response = await send('verify', {service: 'eve'});
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.ok, true);
  assert.equal(data.checks[0].detail, 'Hermes answered.');
  assert.equal(JSON.stringify(data).includes('LFX_'), false);
  fixture.checks = [{name: 'Service', ok: false, detail: 'HTTP 401 — the key was rejected.'}];
  assert.equal((await (await send('verify', {service: 'paperclip'})).json()).ok, false);
});

test('unknown actions are rejected', async () => {
  seed();
  assert.equal((await send('deploy', {})).status, 404);
});
