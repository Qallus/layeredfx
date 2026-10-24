// Consent screen for connecting Claude (or another MCP client) to LayeredFX. Shown only to a signed-in team member;
// approving issues a single-use code to the app's registered return address.
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {approver, checkRequest, pageOrigin, PERMISSIONS} from '@/lib/mcp/consent';
import {withParams} from '@/lib/mcp/oauth.mjs';
import '@/components/operations/oauth.css';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Connect to LayeredFX', robots: {index: false, follow: false}};
const KEYS = ['response_type', 'client_id', 'redirect_uri', 'state', 'code_challenge', 'code_challenge_method', 'scope', 'resource'];

function Card({children}: {children: React.ReactNode}) {
  return <main className="lfx-oauth"><section className="lfx-oauth-card"><p className="lfx-oauth-kicker">LayeredFX Operations</p>{children}</section></main>;
}

export default async function Page({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const raw = await searchParams;
  const params = Object.fromEntries(KEYS.map(k => [k, Array.isArray(raw[k]) ? raw[k]![0] : raw[k] || ''])) as Record<string, string>;
  const origin = await pageOrigin();
  const {client, check} = await checkRequest(params, origin);
  if ('fatal' in check) return <Card><h1>This connection can’t continue</h1><p>{check.fatal}</p><Link href="/admin">Go to the dashboard</Link></Card>;
  if ('error' in check) redirect(withParams(check.redirect, {error: check.error, error_description: check.error_description, state: check.state}));
  const actor = await approver();
  if (actor === 401) redirect(`/admin/login?next=${encodeURIComponent(`/oauth/authorize?${new URLSearchParams(Object.entries(params).filter(([, v]) => v))}`)}`);
  if (actor === 403) return <Card><h1>Access not enabled</h1><p>This account needs an active LayeredFX operations membership before it can connect apps.</p></Card>;
  const host = new URL(check.ok.redirect).host;
  const lines = actor.role === 'viewer' ? PERMISSIONS.read : [...PERMISSIONS.read, ...PERMISSIONS.write];
  return <Card>
    <h1>Connect {client!.name} to LayeredFX?</h1>
    <p>Signed in as <b>{actor.name}</b> ({actor.role}). {client!.name} will act as you, with your permissions:</p>
    <ul>{lines.map(line => <li key={line}>{line}</li>)}</ul>
    <p className="lfx-oauth-muted">{PERMISSIONS.never}</p>
    <p className="lfx-oauth-muted">After approval you return to <b>{host}</b>. You can disconnect at any time from your dashboard profile.</p>
    <form method="post" action="/api/oauth/authorize">
      {Object.entries(params).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
      <div className="lfx-oauth-actions"><button type="submit" name="decision" value="approve" className="is-primary">Allow access</button><button type="submit" name="decision" value="deny">Cancel</button></div>
    </form>
  </Card>;
}
