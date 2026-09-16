import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const dataUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const engine = new URL('../lib/operations/engine.mjs', import.meta.url).href;
let code = ts.transpileModule(readFileSync(new URL('../lib/agents/client.ts', import.meta.url), 'utf8'), {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022}}).outputText;
code = code.replace(/import ['"]server-only['"];?/, '').replaceAll("'@/lib/operations/engine.mjs'", `'${engine}'`);
const client = await import(dataUrl(code));

const KEYS = {LFX_HERMES_URL: 'https://agent.layeredfx.com', LFX_HERMES_API_KEY: 'hermes-secret-key', LFX_HERMES_MODEL: 'eve',
  LFX_PAPERCLIP_URL: 'https://team.layeredfx.com', LFX_PAPERCLIP_API_KEY: 'paperclip-secret-key', LFX_PAPERCLIP_COMPANY_ID: 'company-1'};
const SECRETS = ['hermes-secret-key', 'paperclip-secret-key'];
const original = globalThis.fetch;
let calls = [], handler = () => new Response('{}', {status: 200});
globalThis.fetch = async (url, init) => { calls.push({url: String(url), init}); return handler(String(url), init); };
test.after(() => { globalThis.fetch = original; });
const configure = (over = {}) => { for (const [key, value] of Object.entries({...KEYS, ...over})) { if (value === null) delete process.env[key]; else process.env[key] = value; } };
const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
const status = async fn => { try { await fn(); return 200; } catch (e) { return e.status || 500; } };
test.beforeEach(() => { calls = []; configure(); });

test('an unconfigured service refuses before any request is made', async () => {
  configure({LFX_HERMES_API_KEY: null, LFX_PAPERCLIP_COMPANY_ID: null});
  assert.equal(await status(() => client.hermesChat({system: 's', prompt: 'p'})), 503);
  assert.equal(await status(() => client.paperclipCreateIssue({title: 't', description: 'd', priority: 'medium', marker: 'm'})), 503);
  assert.equal(calls.length, 0);
  assert.equal(client.hermesReady(), false);
  const checks = await client.hermesHealth();
  assert.equal(checks[0].ok, false);
});

test('Eve replies are parsed and never carry the key', async () => {
  handler = () => json({id: 'resp_9', model: 'eve', choices: [{message: {content: '  Draft follow-up  '}}]});
  const reply = await client.hermesChat({system: 'system', prompt: 'prompt'});
  assert.equal(reply.id, 'resp_9');
  assert.equal(reply.text, 'Draft follow-up');
  assert.equal(calls[0].url, 'https://agent.layeredfx.com/v1/chat/completions');
  assert.equal(JSON.parse(calls[0].init.body).model, 'eve');
  for (const secret of SECRETS) assert.equal(JSON.stringify(reply).includes(secret), false);
});

test('an empty answer is reported instead of being recorded', async () => {
  handler = () => json({id: 'resp_1', choices: [{message: {content: '   '}}]});
  assert.equal(await status(() => client.hermesChat({system: 's', prompt: 'p'})), 502);
});

test('a Paperclip task saved behind a 500 is found by its marker instead of being sent twice', async () => {
  const marker = 'lfx-assign_1-1';
  handler = (url, init) => init?.method === 'POST'
    ? new Response('server error', {status: 500})
    : json({issues: [{id: 'PC-77', description: `Do the thing\n\n${marker}`}]});
  const issue = await client.paperclipCreateIssue({title: 'Task', description: 'Do the thing', priority: 'high', marker});
  assert.equal(issue.id, 'PC-77');
  assert.equal(issue.confirmed, false, 'saved, but Paperclip did not confirm it');
  assert.equal(issue.url, 'https://team.layeredfx.com/issues/PC-77');
  assert.equal(calls.filter(c => c.init?.method === 'POST').length, 1, 'the create is never retried');
});

test('a failed create with no matching task is reported, not silently accepted', async () => {
  handler = (url, init) => init?.method === 'POST' ? new Response('boom', {status: 500}) : json({issues: []});
  await assert.rejects(() => client.paperclipCreateIssue({title: 'Task', description: 'd', priority: 'low', marker: 'lfx-assign_2-1'}),
    e => e.status === 502 && /did not confirm/i.test(e.message));
});

test('a timeout is reported as a provider failure', async () => {
  handler = () => { throw Object.assign(new Error('aborted'), {name: 'TimeoutError'}); };
  await assert.rejects(() => client.hermesChat({system: 's', prompt: 'p'}), e => e.status === 502 && /did not respond/i.test(e.message));
});

test('a rejected key is reported without echoing the provider body', async () => {
  handler = () => new Response('{"error":"bad token hermes-secret-key"}', {status: 401});
  const checks = await client.hermesHealth();
  assert.equal(checks[0].ok, false);
  assert.match(checks[0].detail, /401/);
  const text = JSON.stringify(checks);
  for (const secret of SECRETS) assert.equal(text.includes(secret), false);
  await assert.rejects(() => client.paperclipAgents(), e => e.status === 502 && /rejected the API key/i.test(e.message));
});

test('a healthy Hermes confirms the configured profile', async () => {
  handler = url => url.endsWith('/health') ? json({status: 'ok'}) : json({data: [{id: 'eve'}, {id: 'scratch'}]});
  const checks = await client.hermesHealth();
  assert.deepEqual(checks.map(c => c.ok), [true, true]);
  assert.match(checks[1].name, /eve/);
  configure({LFX_HERMES_MODEL: 'missing-profile'});
  assert.equal((await client.hermesHealth())[1].ok, false);
});

test('Paperclip health reports how many agents the company key can see', async () => {
  handler = () => json({agents: [{id: 'a1', name: 'Writer'}, {id: 'a2', name: 'Researcher'}]});
  const checks = await client.paperclipHealth();
  assert.equal(checks[0].ok, true);
  assert.match(checks[0].detail, /2 agents/);
  assert.deepEqual((await client.paperclipAgents()).map(a => a.name), ['Writer', 'Researcher']);
});
