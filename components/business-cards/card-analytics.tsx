"use client";
// Per-card analytics, adapted from Channel Cast OS components/business-cards/card-analytics.tsx.
import {useEffect, useState} from 'react';
import {ArrowLeft, Eye} from 'lucide-react';
import {Button, PageTitle, Panel, Views} from '@/components/operations/shared';
import {cardName, publicCardUrl} from '@/lib/business-cards/model';
import type {BusinessCard, CardAnalytics} from '@/lib/business-cards/types';

export function CardAnalyticsView({card, siteUrl, onClose}: {card: BusinessCard; siteUrl: string; onClose: () => void}) {
  const [data, setData] = useState<CardAnalytics | null>(null);
  const [range, setRange] = useState(30);
  const [error, setError] = useState('');
  const loading = !data && !error;

  useEffect(() => {
    let cancelled = false;
    setData(null); setError('');
    fetch(`/api/admin/business-cards/${card.id}/analytics?range=${range}`, {cache: 'no-store'})
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.message || 'Analytics could not be loaded.'); return j.analytics as CardAnalytics; })
      .then(a => { if (!cancelled) setData(a); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Analytics could not be loaded.'); });
    return () => { cancelled = true; };
  }, [card.id, range]);

  const tiles: [string, number | undefined][] = [
    ['Views', data?.views], ['Clicks', data?.clicks], ['Shares', data?.shares], ['Contact saves', data?.saves],
    ['Leads (all time)', data?.leads], ['Likes', data?.totals.like ?? 0], ['QR scans', data?.totals.qr_scan ?? 0], ['NFC taps', data?.totals.nfc_tap ?? 0],
  ];
  const max = Math.max(1, ...(data?.daily.map(d => d.views + d.clicks) ?? [1]));
  const maxLink = Math.max(1, ...(data?.topLinks.map(l => l.count) ?? [1]));

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft aria-hidden size={15}/> Business cards</Button>
      <PageTitle eyebrow="LAYEREDFX / BUSINESS CARD ANALYTICS" title={cardName(card)} description={`Activity for the last ${range} days. Lifetime counters appear on the card list.`}>
        <Views values={['7 days', '30 days', '90 days']} value={`${range} days`} onChange={v => setRange(Number(v.split(' ')[0]))}/>
        {card.status === 'published' && <Button asChild variant="outline" size="sm"><a href={publicCardUrl(siteUrl, card.slug)} target="_blank" rel="noopener noreferrer"><Eye aria-hidden size={14}/> Public page</a></Button>}
      </PageTitle>
      {error && <p role="alert" className="ops-error">{error}</p>}
      <div className="ops-stats" aria-busy={loading}>{tiles.map(([label, value]) => <div key={label}><span>{label}</span><b>{loading ? '—' : value ?? 0}</b></div>)}</div>
      <div className="ops-two-columns">
        <Panel title="Daily activity">
          {loading ? <p role="status">Loading…</p> : !data?.daily.some(d => d.views || d.clicks) ? <p className="ops-muted">No activity in this period.</p> : <>
            <div className="flex h-44 items-end gap-1" role="img" aria-label={`Daily views and clicks for the last ${data.daily.length} days`}>
              {data.daily.map(d => <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${d.views} views, ${d.clicks} clicks`}>
                <div className="flex w-full flex-col justify-end" style={{height: 150}}>
                  <div className="w-full rounded-t-sm bg-[#d9a441]" style={{height: `${(d.clicks / max) * 100}%`}}/>
                  <div className="w-full bg-[#57704c]" style={{height: `${(d.views / max) * 100}%`}}/>
                </div>
                <span className="text-[8px] text-[#718079]">{d.date}</span>
              </div>)}
            </div>
            <p className="ops-muted mt-3 flex gap-4"><span><span aria-hidden className="mr-1 inline-block h-2 w-2 bg-[#57704c]"/>Views</span><span><span aria-hidden className="mr-1 inline-block h-2 w-2 bg-[#d9a441]"/>Clicks</span> Days use Arizona time.</p>
            <table className="sr-only"><caption>Daily activity</caption><thead><tr><th>Date</th><th>Views</th><th>Clicks</th></tr></thead><tbody>{data.daily.map(d => <tr key={d.date}><td>{d.date}</td><td>{d.views}</td><td>{d.clicks}</td></tr>)}</tbody></table>
          </>}
        </Panel>
        <Panel title="Top links">
          {loading ? <p role="status">Loading…</p> : data?.topLinks.length ? <ul className="m-0 list-none space-y-2 p-0">
            {data.topLinks.map(l => <li key={l.label}>
              <div className="mb-0.5 flex justify-between text-xs"><span className="truncate">{l.label}</span><span>{l.count}</span></div>
              <div className="ops-progress m-0"><span style={{width: `${(l.count / maxLink) * 100}%`}}/></div>
            </li>)}
          </ul> : <p className="ops-muted">No link clicks tracked in this period.</p>}
          <p className="ops-muted mt-4">Copy-link actions: <b>{data?.totals.copy_link ?? 0}</b></p>
        </Panel>
      </div>
    </div>
  );
}
