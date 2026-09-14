"use client";
// Card lead inbox, adapted from Channel Cast OS components/business-cards/leads-inbox.tsx.
// Conversion goes through the operations command boundary (cardlead.import /
// cardlead.pipeline) so leads, contacts and opportunities are never duplicated.
import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {Mail, Phone, RefreshCw, Trash2} from 'lucide-react';
import {useOperations} from '@/components/operations/provider';
import {Button, Empty, Views} from '@/components/operations/shared';
import {LEAD_STATUSES, operationsCardLead} from '@/lib/business-cards/model';
import type {BusinessCardLead, LeadStatus} from '@/lib/business-cards/types';

const when = (iso: string) => new Date(iso).toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Phoenix'});

export function LeadsInbox({scopeAll, onChanged}: {scopeAll: boolean; onChanged: () => void}) {
  const {state, actor, dispatch, busy} = useOperations();
  const [leads, setLeads] = useState<BusinessCardLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const writable = actor.role !== 'viewer';

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/business-cards/leads${scopeAll ? '?scope=all' : ''}`, {cache: 'no-store'});
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Leads could not be loaded.');
      setLeads(data.leads);
    } catch (e) { setError(e instanceof Error ? e.message : 'Leads could not be loaded.'); }
    finally { setLoading(false); }
  }, [scopeAll]);
  useEffect(() => { void load(); }, [load]);

  async function request(lead: BusinessCardLead, method: 'PATCH' | 'DELETE', body: Record<string, unknown> = {}) {
    const res = await fetch(`/api/admin/business-cards/leads/${lead.id}`, {method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({revision: lead.revision, ...body})});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'The lead was not updated.');
    return data;
  }
  async function run(action: () => Promise<string>) {
    setWorking(true); setError(''); setNotice('');
    try { setNotice(await action()); }
    catch (e) { setError(e instanceof Error ? e.message : 'The change was not saved.'); }
    finally { setWorking(false); await load(); onChanged(); }
  }
  const convert = (lead: BusinessCardLead, pipeline: boolean) => run(async () => {
    const id = await dispatch({type: pipeline ? 'cardlead.pipeline' : 'cardlead.import', cardLeadId: lead.id, cardLead: operationsCardLead(lead), owner: lead.owner_id || actor.id});
    if (!id) throw new Error('The lead was not converted. See the message above and try again.');
    if (lead.status === 'new' || lead.status === 'contacted') await request(lead, 'PATCH', {status: 'qualified'});
    return pipeline ? 'Added to the pipeline.' : 'Saved as a LayeredFX lead.';
  });

  const counts = Object.fromEntries(['all', ...LEAD_STATUSES].map(s => [s, s === 'all' ? leads.length : leads.filter(l => l.status === s).length]));
  const shown = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  return (
    <div>
      <div className="ops-toolbar">
        <Views values={['all', ...LEAD_STATUSES].map(s => `${s} (${counts[s]})`)} value={`${filter} (${counts[filter]})`} onChange={v => setFilter(v.split(' ')[0] as typeof filter)}/>
        <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw aria-hidden size={14}/> Refresh</Button>
      </div>
      {error && <p role="alert" className="ops-error">{error}</p>}
      {notice && <p role="status" className="ops-info mb-4">{notice}</p>}
      {loading && !leads.length ? <p role="status">Loading leads…</p> : !shown.length ? <div className="ops-panel"><Empty>No leads here yet. When someone uses “Send me your info” on a published card, their details appear in this list.</Empty></div> : (
        <div className="ops-table-wrap"><table className="ops-table">
          <thead><tr><th>Contact</th><th>Message</th><th>Card</th><th>Received</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{shown.map(lead => {
            const linked = state.leads.find(l => l.cardLeads?.some(c => c.id === lead.id));
            const disabled = !writable || working || busy;
            return <tr key={lead.id}>
              <td><b>{lead.name || lead.email || lead.phone}</b>
                {lead.email && <small><a className="inline-flex items-center gap-1" href={`mailto:${lead.email}`}><Mail aria-hidden size={12}/>{lead.email}</a></small>}
                {lead.phone && <small><a className="inline-flex items-center gap-1" href={`tel:${lead.phone}`}><Phone aria-hidden size={12}/>{lead.phone}</a></small>}
                {lead.company && <small>{lead.company}</small>}</td>
              <td className="max-w-[280px] whitespace-pre-wrap text-[11px]">{lead.message || '—'}</td>
              <td>{lead.card_name || '—'}</td>
              <td className="whitespace-nowrap">{when(lead.created_at)}</td>
              <td><select aria-label={`Status for ${lead.name || lead.email}`} disabled={disabled} value={lead.status} onChange={e => run(async () => { await request(lead, 'PATCH', {status: e.target.value}); return 'Status updated.'; })}>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
              <td><div className="flex flex-col items-start gap-1">
                {linked ? <Link className="underline" href="/admin/leads">Open lead</Link> : <Button size="sm" variant="outline" disabled={disabled} onClick={() => convert(lead, false)}>Convert to lead</Button>}
                {linked?.opportunityId ? <Link className="underline" href={`/admin/pipeline/${linked.opportunityId}`}>Open opportunity</Link> : <Button size="sm" variant="outline" disabled={disabled} onClick={() => convert(lead, true)}>Add to pipeline</Button>}
                <Button size="sm" variant="ghost" disabled={disabled} onClick={() => { if (confirm(linked ? 'Delete this card submission? The converted LayeredFX lead is kept.' : 'Delete this lead permanently?')) void run(async () => { await request(lead, 'DELETE'); return 'Lead deleted.'; }); }}><Trash2 aria-hidden size={14}/> Delete</Button>
              </div></td>
            </tr>;
          })}</tbody>
        </table></div>
      )}
    </div>
  );
}
