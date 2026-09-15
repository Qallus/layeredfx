import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('team sign-in keeps its own operations endpoint while sharing the portal layout', () => {
  const team = read('../components/operations/login.tsx');
  assert.match(team, /\/api\/operations\/auth\/login/);
  assert.match(team, /\/api\/operations\/auth\/refresh/);
  assert.doesNotMatch(team, /\/api\/portal\/auth/, 'team sign-in must not use portal auth');
  assert.match(team, /className="portal-auth"/);
  assert.match(team, /href="\/login"/, 'links customers and partners to the portal sign-in');
  assert.match(team, /\/forgot-password/, 'team accounts can reset a password through the shared Supabase project');
});

test('portal sign-in links to team sign-in and uses portal auth only', () => {
  const portal = read('../components/portal/auth.tsx');
  assert.match(portal, /href="\/admin\/login"/);
  assert.doesNotMatch(portal, /\/api\/operations\/auth\/login/);
});

test('admin login page still skips the form only in development demo mode', () => {
  const page = read('../app/admin/login/page.tsx');
  assert.match(page, /mode\(\)==='demo'/);
  const server = read('../lib/operations/server.ts');
  assert.match(server, /process\.env\.NODE_ENV === 'development' && process\.env\.LFX_OPERATIONS_MODE !== 'supabase' \? 'demo' : 'supabase'/);
});
