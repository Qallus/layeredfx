"use client";
import {useState} from 'react';
import {NfcWriter, markNfcActive, useWebNfc} from './nfc-writer';

/** Phone-side half of the NFC write flow, opened from the QR code in the card list. */
export function NfcPhoneWriter({cardId, revision: initialRevision, url, published, nfcActive}: {cardId: string; revision: number; url: string; published: boolean; nfcActive: boolean}) {
  const supported = useWebNfc();
  const [revision, setRevision] = useState(initialRevision);
  const [active, setActive] = useState(nfcActive);
  const [error, setError] = useState('');
  return (
    <div className="ops-panel"><div className="ops-panel-body space-y-4">
      {!published && <p className="ops-info">This card isn&apos;t published. Items can still be written, but a tap shows “not found” until you publish it.</p>}
      <div className="break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">{url}</div>
      {supported === null ? null : supported
        ? <NfcWriter url={url} onWritten={async () => {
          if (active) return;
          try { setRevision(await markNfcActive({id: cardId, revision})); setActive(true); setError(''); }
          catch (e) { setError(e instanceof Error ? e.message : 'The NFC status was not saved.'); }
        }}/>
        : <p className="text-sm">This browser can&apos;t write NFC — open this page in <b>Chrome on Android</b>. On iPhone, use an NFC writing app to write a URL record containing the link above.</p>}
      {error && <p role="alert" className="ops-error">{error}</p>}
    </div></div>
  );
}
