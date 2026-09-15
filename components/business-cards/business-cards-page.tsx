"use client";
// Business cards dashboard, adapted from Channel Cast OS components/business-cards/business-cards-page.tsx.
import {useCallback, useEffect, useState} from 'react';
import {Archive, ArchiveRestore, BarChart3, Copy, Eye, EyeOff, Globe, Pencil, Plus, QrCode, RefreshCw, Smartphone, Trash2} from 'lucide-react';
import {useOperations} from '@/components/operations/provider';
import {Button, Empty, PageTitle, Views, dateLabel} from '@/components/operations/shared';
import {cardName, publicCardUrl} from '@/lib/business-cards/model';
import type {BusinessCard, CardStats, OwnerOption} from '@/lib/business-cards/types';
import {CardAnalyticsView} from './card-analytics';
import {CardBuilder, type AutomationSupport} from './card-builder';
import {LeadsInbox} from './leads-inbox';
import {NfcWriteDialog, markNfcActive} from './nfc-writer';
import './business-cards.css';

type Payload = {cards: BusinessCard[]; stats: CardStats; actor: {id: string; name: string; email: string | null; role: string}; ownerOptions: OwnerOption[]; siteUrl: string; automations: AutomationSupport};
type Layout = 'Cards' | 'List' | 'Table';
const LAYOUTS: Layout[] = ['Cards', 'List', 'Table'];
const LAYOUT_KEY = 'lfx:business-cards:layout';
const TILES: [keyof CardStats, string, string][] = [
  ['cards', 'Cards', 'Not archived'], ['published', 'Published', 'Live public URLs'], ['views', 'Views', 'Page loads, QR scans, NFC taps'], ['clicks', 'Clicks', 'Links and copy link'],
  ['nfcReady', 'NFC', 'Ordered, assigned or active'], ['shares', 'Shares', 'Shared from the card'], ['saves', 'Contact saves', 'vCard downloads'], ['leads', 'Leads', 'Form submissions'],
];
const STATUS_LABEL: Record<BusinessCard['status'], string> = {draft: 'Draft', published: 'Published', unpublished: 'Unpublished', archived: 'Archived'};
const statusClass = (status: BusinessCard['status']) => `ops-badge ${status === 'published' ? 'stage-closed_won' : status === 'archived' ? 'stage-closed_lost' : ''}`;
const qrSrc = (card: BusinessCard, size: number) => `/api/cards/qr?slug=${encodeURIComponent(card.slug)}&source=qr&size=${size}`;

type CardHandlers = {
  writable: boolean; working: boolean; siteUrl: string;
  onEdit: (card: BusinessCard) => void; onAnalytics: (card: BusinessCard) => void; onCopy: (card: BusinessCard) => void; onNfc: (card: BusinessCard) => void;
  onPatch: (card: BusinessCard, body: Record<string, unknown>, method: 'PATCH' | 'DELETE', message: string) => void;
};

/** One row of actions: a labelled Edit button, then icon buttons with tooltips and accessible names. */
function CardActions({card, h}: {card: BusinessCard; h: CardHandlers}) {
  const name = cardName(card);
  const published = card.status === 'published';
  const disabled = !h.writable || h.working;
  const icon = (label: string, node: React.ReactNode, props: React.ComponentProps<typeof Button>) =>
    <Button size="icon" variant="outline" aria-label={`${label}: ${name}`} title={label} className="shrink-0" {...props}>{props.children ?? node}</Button>;
  return (
    <div className="bc-actions flex flex-nowrap items-center overflow-x-auto">
      <Button size="sm" className="shrink-0" onClick={() => h.onEdit(card)} disabled={!h.writable} aria-label={`Edit ${name}`} title="Edit"><Pencil aria-hidden size={14}/><span className="bc-label">Edit</span></Button>
      {icon('Analytics', <BarChart3 aria-hidden size={15}/>, {onClick: () => h.onAnalytics(card)})}
      {icon('Copy link', <Copy aria-hidden size={15}/>, {onClick: () => h.onCopy(card)})}
      {published && icon('Open public page', <Eye aria-hidden size={15}/>, {asChild: true, children: <a href={publicCardUrl(h.siteUrl, card.slug)} target="_blank" rel="noopener noreferrer"><Eye aria-hidden size={15}/></a>})}
      {icon('Download QR PNG', <QrCode aria-hidden size={15}/>, {asChild: true, children: <a href={`/api/cards/qr?slug=${encodeURIComponent(card.slug)}&source=qr&size=1024&download=1&fg=${encodeURIComponent(card.qr_settings.foreground || '#19202e')}`}><QrCode aria-hidden size={15}/></a>})}
      {icon('Write NFC', <Smartphone aria-hidden size={15}/>, {onClick: () => h.onNfc(card), disabled})}
      {card.status !== 'archived' && icon(published ? 'Unpublish' : 'Publish', published ? <EyeOff aria-hidden size={15}/> : <Globe aria-hidden size={15}/>,
        {disabled, onClick: () => h.onPatch(card, {status: published ? 'unpublished' : 'published'}, 'PATCH', published ? 'Card unpublished.' : 'Card published.')})}
      {card.status === 'archived'
        ? icon('Restore as draft', <ArchiveRestore aria-hidden size={15}/>, {disabled, onClick: () => h.onPatch(card, {status: 'draft'}, 'PATCH', 'Card restored as a draft.')})
        : icon('Archive', <Archive aria-hidden size={15}/>, {disabled, onClick: () => { if (confirm(`Archive ${name}? Its public page stops working; leads are kept.`)) h.onPatch(card, {status: 'archived'}, 'PATCH', 'Card archived.'); }})}
      {icon('Delete', <Trash2 aria-hidden size={15}/>, {disabled, onClick: () => { if (confirm(`Delete ${name} permanently? Cards with leads must be archived instead.`)) h.onPatch(card, {}, 'DELETE', 'Card deleted.'); }})}
    </div>
  );
}

const counters = (card: BusinessCard) => `${card.view_count} views · ${card.click_count} clicks · ${card.save_count} saves · NFC ${card.nfc_status.replace('_', ' ')}`;

/** Profile photo, or the first initial when the card has no photo. */
function CardAvatar({card, size}: {card: BusinessCard; size: 'lg' | 'sm'}) {
  const name = cardName(card);
  return card.profile_photo_url
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={card.profile_photo_url} alt="" className={`bc-avatar bc-avatar-${size}`}/>
    : <span aria-hidden className={`bc-avatar bc-avatar-${size}`}>{name.slice(0, 1).toUpperCase()}</span>;
}

function CardQr({card, size}: {card: BusinessCard; size: 'lg' | 'sm'}) {
  return <div className={`bc-qr bc-qr-${size}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={qrSrc(card, size === 'lg' ? 400 : 160)} alt={size === 'lg' ? `QR code for ${cardName(card)}` : ''}/>
  </div>;
}

function CardGrid({cards, h, showOwner}: {cards: BusinessCard[]; h: CardHandlers; showOwner: boolean}) {
  return <div className="bc-cards">{cards.map(card => {
    const url = publicCardUrl(h.siteUrl, card.slug);
    return <article key={card.id} className="ops-panel bc-card">
      <CardAvatar card={card} size="lg"/>
      <div className="bc-card-body">
        <div className="bc-card-heading">
          {/* Inline size: the site's global heading styles otherwise enlarge this title. */}
          <h2 className="m-0 truncate font-semibold" style={{fontSize: 18, lineHeight: 1.35, letterSpacing: 0}} title={cardName(card)}>{cardName(card)}</h2>
          <span className={statusClass(card.status)}>{STATUS_LABEL[card.status]}</span>
        </div>
        {(card.job_title || card.company_name) && <p className="m-0 truncate text-sm">{[card.job_title, card.company_name].filter(Boolean).join(' · ')}</p>}
        <p className="ops-muted m-0 truncate">{url.replace(/^https?:\/\//, '')}</p>
        {showOwner && <p className="ops-muted m-0">Owner: {card.owner_name || 'Unassigned'}</p>}
        <p className="ops-muted m-0">{counters(card)}</p>
        <div className="mt-3"><CardActions card={card} h={h}/></div>
      </div>
      <CardQr card={card} size="lg"/>
    </article>;
  })}</div>;
}

function CardList({cards, h, showOwner}: {cards: BusinessCard[]; h: CardHandlers; showOwner: boolean}) {
  return <ul className="ops-panel m-0 list-none p-0">{cards.map((card, i) => (
    <li key={card.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 ${i ? 'border-t' : ''}`}>
      <CardAvatar card={card} size="sm"/>
      <div className="min-w-[200px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{cardName(card)}</span>
          <span className={statusClass(card.status)}>{STATUS_LABEL[card.status]}</span>
        </div>
        <p className="ops-muted m-0 truncate">{publicCardUrl(h.siteUrl, card.slug).replace(/^https?:\/\//, '')}{showOwner ? ` · ${card.owner_name || 'Unassigned'}` : ''}</p>
        <p className="ops-muted m-0">{counters(card)}</p>
      </div>
      <CardActions card={card} h={h}/>
      <CardQr card={card} size="sm"/>
    </li>
  ))}</ul>;
}

function CardTable({cards, h, showOwner}: {cards: BusinessCard[]; h: CardHandlers; showOwner: boolean}) {
  return <div className="ops-table-wrap"><table className="ops-table">
    <thead><tr><th>Card</th><th>Status</th>{showOwner && <th>Owner</th>}<th>Activity</th><th>NFC</th><th>Updated</th><th>QR</th><th>Actions</th></tr></thead>
    <tbody>{cards.map(card => <tr key={card.id}>
      <td><div className="flex items-center gap-3"><CardAvatar card={card} size="sm"/><div className="min-w-0"><b>{cardName(card)}</b><small>/card/{card.slug}</small></div></div></td>
      <td><span className={statusClass(card.status)}>{STATUS_LABEL[card.status]}</span></td>
      {showOwner && <td>{card.owner_name || 'Unassigned'}</td>}
      <td className="whitespace-nowrap">{card.view_count} views<small>{card.click_count} clicks · {card.save_count} saves</small></td>
      <td className="whitespace-nowrap capitalize">{card.nfc_status.replace('_', ' ')}</td>
      <td className="whitespace-nowrap">{dateLabel(card.updated_at)}</td>
      <td><CardQr card={card} size="sm"/></td>
      <td><CardActions card={card} h={h}/></td>
    </tr>)}</tbody>
  </table></div>;
}

export function BusinessCardsPage() {
  const {mode} = useOperations();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scopeAll, setScopeAll] = useState(false);
  const [tab, setTab] = useState<'Cards' | 'Leads'>('Cards');
  const [filter, setFilter] = useState<'All' | 'Published' | 'Drafts' | 'Archived'>('All');
  const [layout, setLayout] = useState<Layout>('Cards');
  const [editing, setEditing] = useState<BusinessCard | 'new' | null>(null);
  const [analytics, setAnalytics] = useState<BusinessCard | null>(null);
  const [nfcCard, setNfcCard] = useState<BusinessCard | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem(LAYOUT_KEY); if (LAYOUTS.includes(saved as Layout)) setLayout(saved as Layout); } catch { /* layout stays Cards */ }
  }, []);
  function chooseLayout(next: Layout) {
    setLayout(next);
    try { localStorage.setItem(LAYOUT_KEY, next); } catch { /* not remembered */ }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/business-cards${scopeAll ? '?scope=all' : ''}`, {cache: 'no-store'});
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Business cards could not be loaded.');
      setData(json); setError('');
      return json as Payload;
    } catch (e) { setError(e instanceof Error ? e.message : 'Business cards could not be loaded.'); return null; }
    finally { setLoading(false); }
  }, [scopeAll]);
  useEffect(() => { void load(); }, [load]);

  const isAdmin = data?.actor.role === 'admin';
  const writable = Boolean(data && data.actor.role !== 'viewer');

  async function patch(card: BusinessCard, body: Record<string, unknown>, method: 'PATCH' | 'DELETE' = 'PATCH', message = 'Card updated.') {
    setWorking(true); setError(''); setNotice('');
    try {
      const res = await fetch(`/api/admin/business-cards/${card.id}`, {method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({revision: card.revision, ...body})});
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'The card was not updated.');
      setNotice(message);
    } catch (e) { setError(e instanceof Error ? e.message : 'The card was not updated.'); }
    finally { setWorking(false); await load(); }
  }
  async function copy(card: BusinessCard) {
    try { await navigator.clipboard.writeText(publicCardUrl(data!.siteUrl, card.slug)); setNotice(`Copied the public URL for ${cardName(card)}.`); }
    catch { setError('Copy failed. Open the card and copy the URL from the NFC or settings panel.'); }
  }

  if (analytics && data) return <CardAnalyticsView card={analytics} siteUrl={data.siteUrl} onClose={() => setAnalytics(null)}/>;
  if (editing && data) return <CardBuilder card={editing === 'new' ? null : editing} actor={data.actor} ownerOptions={data.ownerOptions} siteUrl={data.siteUrl} automations={data.automations}
    onClose={() => { setEditing(null); void load(); }} onSaved={saved => { setEditing(saved); void load(); }}/>;

  const cards = (data?.cards ?? []).filter(c => filter === 'All' ? c.status !== 'archived' : filter === 'Published' ? c.status === 'published' : filter === 'Archived' ? c.status === 'archived' : c.status === 'draft' || c.status === 'unpublished');
  const handlers: CardHandlers = {writable, working, siteUrl: data?.siteUrl ?? '', onEdit: setEditing, onAnalytics: setAnalytics, onCopy: c => void copy(c), onNfc: setNfcCard, onPatch: (c, b, m, msg) => void patch(c, b, m, msg)};
  const leadsLabel = `Leads${data?.stats.newLeads ? ` (${data.stats.newLeads} new)` : ''}`;

  return (
    <>
      <PageTitle title="Business Cards" description="Digital business cards with a public page, QR code, NFC tap-to-share, lead capture and analytics.">
        {isAdmin && <Views values={['My cards', 'All cards']} value={scopeAll ? 'All cards' : 'My cards'} onChange={v => setScopeAll(v === 'All cards')}/>}
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw aria-hidden size={15}/> Refresh</Button>
        <Button onClick={() => setEditing('new')} disabled={!writable}><Plus aria-hidden size={15}/> Create card</Button>
      </PageTitle>
      {mode === 'demo' && <p className="ops-info mb-4">Development demo: cards, leads and analytics are stored in <code>.local-data/business-cards</code> on this computer. Image upload and SMS automations are unavailable here; paste https image URLs instead.</p>}
      {error && <p role="alert" className="ops-error">{error}</p>}
      {notice && <p role="status" className="ops-info mb-4">{notice}</p>}
      <div className="ops-toolbar"><Views values={['Cards', leadsLabel]} value={tab === 'Cards' ? 'Cards' : leadsLabel} onChange={v => setTab(v.startsWith('Leads') ? 'Leads' : 'Cards')}/></div>

      {tab === 'Leads' ? <LeadsInbox scopeAll={scopeAll} onChanged={() => void load()}/> : <>
        <div className="ops-stats">{TILES.map(([key, label, hint]) => <div key={key}><span>{label}</span><b>{data ? data.stats[key] : '—'}</b><small>{hint}</small></div>)}</div>
        <div className="ops-toolbar">
          <Views values={['All', 'Published', 'Drafts', 'Archived']} value={filter} onChange={v => setFilter(v as typeof filter)}/>
          <div className="flex items-center gap-2"><span className="ops-muted">Layout</span><Views values={LAYOUTS} value={layout} onChange={v => chooseLayout(v as Layout)}/></div>
        </div>
        {loading && !data ? <p role="status">Loading business cards…</p> : !cards.length ? <div className="ops-panel"><Empty>
          <p>{filter === 'All' ? 'No business cards yet. Create a card to get a public URL, QR code and lead form.' : `No ${filter.toLowerCase()} cards.`}</p>
          {filter === 'All' && writable && <Button onClick={() => setEditing('new')}><Plus aria-hidden size={15}/> Create card</Button>}
        </Empty></div>
          : layout === 'List' ? <CardList cards={cards} h={handlers} showOwner={scopeAll}/>
          : layout === 'Table' ? <CardTable cards={cards} h={handlers} showOwner={scopeAll}/>
          : <CardGrid cards={cards} h={handlers} showOwner={scopeAll}/>}
      </>}

      {data && <NfcWriteDialog card={nfcCard} siteUrl={data.siteUrl} onClose={() => { setNfcCard(null); void load(); }} onWritten={async () => {
        if (!nfcCard || nfcCard.nfc_status === 'active') return;
        try { const revision = await markNfcActive(nfcCard); setNfcCard({...nfcCard, revision, nfc_status: 'active'}); }
        catch (e) { setError(e instanceof Error ? e.message : 'The NFC status was not saved.'); }
      }}/>}
    </>
  );
}
