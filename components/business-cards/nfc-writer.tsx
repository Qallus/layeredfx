"use client";
// Web NFC writing, adapted from Channel Cast OS components/business-cards/nfc-writer.tsx.
import {useEffect, useRef, useState} from 'react';
import {Check, Copy, Lock, Smartphone} from 'lucide-react';
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '@/components/layeredfx/ui/dialog';
import {Button} from '@/components/operations/shared';
import {cardName, publicCardUrl} from '@/lib/business-cards/model';
import type {BusinessCard} from '@/lib/business-cards/types';

/** Web NFC only exists in Chrome on Android. Resolved after mount so server and client renders agree. */
export function useWebNfc() {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => { setSupported('NDEFReader' in window); }, []);
  return supported;
}

/** Marks a saved card's NFC status active after a successful write. Returns the new revision. */
export async function markNfcActive(card: {id: string; revision: number}): Promise<number> {
  const res = await fetch(`/api/admin/business-cards/${card.id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({revision: card.revision, nfc_status: 'active'})});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'The tag was written, but the NFC status was not saved.');
  return data.card.revision;
}

// Web NFC throws DOMExceptions whose raw messages mean little to someone holding a tag.
function explain(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'AbortError') return 'Cancelled.';
  if (name === 'NotAllowedError') return 'NFC permission was blocked. Allow NFC for this site in Chrome site settings, then try again.';
  if (name === 'NotSupportedError') return "This item can't take a URL — it may be locked or not an NDEF tag. Try an NTAG213, 215 or 216.";
  if (name === 'NetworkError') return 'The item moved away before writing finished. Hold it still against the phone and try again.';
  return err instanceof Error ? err.message : 'Could not write the tag.';
}

type NdefReader = {write: (msg: unknown, opts: unknown) => Promise<void>; makeReadOnly: (opts: unknown) => Promise<void>};

/** Writes the card URL to one NFC item after another without leaving the screen. */
export function NfcWriter({url, onWritten}: {url: string; onWritten?: () => Promise<void> | void}) {
  const [state, setState] = useState<'idle' | 'writing' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [count, setCount] = useState(0);
  const [lock, setLock] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function write() {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState('writing');
    setMsg('Hold the item flat against the back of your phone…');
    try {
      const ndef = new (window as unknown as {NDEFReader: new () => NdefReader}).NDEFReader();
      await ndef.write({records: [{recordType: 'url', data: url}]}, {overwrite: true, signal: ctrl.signal});
      if (lock) await ndef.makeReadOnly({signal: ctrl.signal});
      setCount(n => n + 1);
      setState('done');
      setMsg(lock ? 'Written and locked. A tap now opens this card.' : 'Written. A tap now opens this card.');
      await onWritten?.();
    } catch (err) {
      setState('error');
      setMsg(explain(err));
    } finally {
      if (abort.current === ctrl) abort.current = null;
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" className="mt-0.5" checked={lock} onChange={e => setLock(e.target.checked)} disabled={state === 'writing'}/>
        <span><span className="flex items-center gap-1 font-medium"><Lock aria-hidden className="h-3 w-3"/> Lock after writing</span>
          <span className="text-muted-foreground">Permanent — a locked item can never be rewritten. Use it for items you hand out.</span></span>
      </label>
      {state === 'writing'
        ? <Button variant="outline" className="w-full" onClick={() => abort.current?.abort()}>Cancel — waiting for an item…</Button>
        : <Button className="w-full" onClick={write}><Smartphone aria-hidden className="h-4 w-4"/> {count ? 'Write another item' : 'Write to NFC item'}</Button>}
      {msg && <p role={state === 'error' ? 'alert' : 'status'} className={state === 'error' ? 'ops-error' : 'text-xs text-muted-foreground'}>{msg}</p>}
      {count > 0 && <p className="flex items-center gap-1 text-xs font-medium"><Check aria-hidden className="h-3.5 w-3.5 text-[#57704c]"/> {count} {count === 1 ? 'item' : 'items'} written this session</p>}
    </div>
  );
}

export function CopyField({value, label}: {value: string; label: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input aria-label={label} readOnly value={value} onFocus={e => e.currentTarget.select()} className="w-full min-w-0 font-mono text-xs"/>
      <Button size="icon" variant="outline" aria-label={`Copy ${label.toLowerCase()}`} onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the field remains selectable */ } }}>
        {copied ? <Check aria-hidden className="h-4 w-4"/> : <Copy aria-hidden className="h-4 w-4"/>}
      </Button>
    </div>
  );
}

/** Opened from the card list: program an NFC item without opening the editor. */
export function NfcWriteDialog({card, siteUrl, onClose, onWritten}: {card: BusinessCard | null; siteUrl: string; onClose: () => void; onWritten: () => Promise<void>}) {
  const supported = useWebNfc();
  if (!card) return null;
  const url = publicCardUrl(siteUrl, card.slug, 'nfc');
  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="ops-modal">
        <DialogTitle>Write to an NFC item</DialogTitle>
        <DialogDescription>Program a card, sticker or key fob so a tap opens {cardName(card)}&apos;s card.</DialogDescription>
        <div className="ops-form space-y-4">
          {card.status !== 'published' && <p className="ops-info">This card isn&apos;t published. Items can still be written, but a tap shows “not found” until you publish it.</p>}
          <div><div className="mb-1 text-xs font-medium">Tag URL</div><CopyField label="Tag URL" value={url}/><p className="ops-muted mt-1">Taps on this link are counted as NFC taps in analytics.</p></div>
          {supported === null ? null : supported ? <NfcWriter url={url} onWritten={onWritten}/> : (
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <div className="mx-auto rounded-lg bg-white p-2 sm:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/cards/qr?card=${encodeURIComponent(card.id)}&size=320`} alt="QR code that opens the NFC write page on a phone" className="h-32 w-32"/>
              </div>
              <div className="space-y-2 text-xs">
                <p><b>This browser can&apos;t write NFC.</b> Only Chrome on Android can.</p>
                <p><b>Android:</b> scan this code with the phone, sign in if asked, then tap each item to it.</p>
                <p><b>iPhone:</b> Safari can&apos;t write tags. Use an NFC writing app to write a URL record containing the tag URL above.</p>
              </div>
            </div>
          )}
          <div className="ops-actions"><Button variant="outline" onClick={onClose}>Done</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
