"use client";
// Photos & videos for the customer and partner portals, and the same gallery for staff in the dashboard.
// Files upload one at a time because each upload bumps the account revision; the next file uses the revision
// the server just returned, so a batch cannot overwrite a newer record.
import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {ImageUp, Upload} from 'lucide-react';
import {MEDIA_ACCEPT, MEDIA_LIMIT, mediaError, type PortalAccount, type PortalMedia} from '@/lib/portal/model';
import {localMedia} from '@/lib/portal/local-media';

type Queued = {name: string; state: 'working' | 'done' | 'failed'; detail: string};

/** Signed URLs are short-lived, so each tile asks for its own when it mounts. */
function useMediaUrl(file: PortalMedia, demo: boolean, account?: string) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true, object = '';
    (async () => {
      try {
        if (demo) {
          const blob = await localMedia(file.id);
          if (!blob) throw Error('This file is no longer on this device.');
          object = URL.createObjectURL(blob);
          if (active) setUrl(object);
        } else {
          const query = account ? `?account=${encodeURIComponent(account)}&id=${encodeURIComponent(file.id)}` : `?id=${encodeURIComponent(file.id)}`;
          const res = await fetch(`/api/portal/media${query}`, {cache: 'no-store'});
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw Error(data.message || 'Media unavailable.');
          if (active) setUrl(data.url);
        }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Media unavailable.'); }
    })();
    return () => { active = false; if (object) URL.revokeObjectURL(object); };
  }, [file.id, demo, account]);
  return {url, error};
}

export function PortalMediaTile({file, demo}: {file: PortalMedia; demo: boolean}) {
  const {url, error} = useMediaUrl(file, demo);
  return <figure>
    {url && (file.type.startsWith('video/')
      ? <video controls src={url}/>
      : <Image src={url} alt={file.name} width={640} height={480} unoptimized/>)}
    <figcaption>{file.name}</figcaption>
    {error && <small role="alert">{error}</small>}
  </figure>;
}

export function PortalMediaSection({account, setAccount, demo, storageKey}: {
  account: PortalAccount;
  setAccount: (next: PortalAccount) => void;
  demo: boolean;
  storageKey: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<Queued[]>([]);
  const media = account.state.media;
  const remaining = Math.max(0, MEDIA_LIMIT - media.length);

  async function upload(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true);
    const results: Queued[] = files.map(file => ({name: file.name, state: 'working', detail: ''}));
    setQueue(results);
    let current = account;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const problem = mediaError(file, current.state.media.length);
      if (problem) { results[i] = {name: file.name, state: 'failed', detail: problem}; setQueue([...results]); continue; }
      try {
        if (demo) {
          const id = crypto.randomUUID();
          await localMedia(id, file);
          const next = structuredClone(current);
          next.state.media.push({id, name: file.name, type: file.type, path: id, size: file.size});
          next.revision++;
          localStorage.setItem(storageKey, JSON.stringify(next));
          current = next;
        } else {
          const res = await fetch('/api/portal/media', {
            method: 'POST',
            headers: {'Content-Type': file.type, 'x-file-name': encodeURIComponent(file.name), 'x-portal-revision': String(current.revision)},
            body: file,
          });
          const next = await res.json().catch(() => ({}));
          if (!res.ok) throw Error((next as {message?: string}).message || 'Upload failed.');
          current = next as PortalAccount;
        }
        results[i] = {name: file.name, state: 'done', detail: ''};
        setAccount(current);
      } catch (e) {
        results[i] = {name: file.name, state: 'failed', detail: e instanceof Error ? e.message : 'Upload failed.'};
      }
      setQueue([...results]);
    }
    setBusy(false);
  }

  const working = queue.filter(item => item.state === 'working').length;
  const label = busy ? `Uploading ${queue.length - working} of ${queue.length}…` : 'Upload photos';
  return <section className="portal-card">
    <h2>Your project, in pictures.</h2>
    <p>Add photos and video of your space. Everything here stays private to your account and the LayeredFX team.</p>
    <div
      className={`portal-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); void upload(Array.from(e.dataTransfer.files)); }}
    >
      <span className="portal-dropzone-icon" aria-hidden><ImageUp size={22}/></span>
      <p><b>Drag photos here</b> or choose them from your device.</p>
      <small>JPEG, PNG, WebP, MP4 or WebM · up to 20 MB each · {remaining} of {MEDIA_LIMIT} left</small>
      <button type="button" className="portal-primary" disabled={busy || !remaining} onClick={() => input.current?.click()}>
        <Upload size={17} aria-hidden/>{label}
      </button>
      <input
        ref={input} type="file" multiple accept={MEDIA_ACCEPT} disabled={busy || !remaining}
        aria-label="Choose photos or video to upload"
        onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; void upload(files); }}
      />
    </div>
    {queue.length > 0 && <ul className="portal-upload-list">
      {queue.map((item, index) => <li key={`${item.name}-${index}`}>
        <span>{item.name}</span>
        <span className={`is-${item.state}`} role={item.state === 'failed' ? 'alert' : undefined}>
          {item.state === 'working' ? 'Uploading…' : item.state === 'done' ? 'Added' : item.detail}
        </span>
      </li>)}
    </ul>}
    {media.length
      ? <>
        <p className="portal-media-count">{media.length} {media.length === 1 ? 'file' : 'files'}</p>
        <div className="portal-media-grid">{media.map(file => <PortalMediaTile key={file.id} file={file} demo={demo}/>)}</div>
      </>
      : <p className="portal-media-empty">No photos yet. Anything you add shows up here for you and the LayeredFX team.</p>}
  </section>;
}

/** Staff view of one account's media in the dashboard: thumbnails that open the full file. */
export function PortalMediaGallery({userId, media}: {userId: string; media: PortalMedia[]}) {
  if (!media.length) return <p className="ops-muted">No photos or video uploaded yet.</p>;
  return <div className="ops-portal-media">{media.map(file => <StaffTile key={file.id} file={file} userId={userId}/>)}</div>;
}

function StaffTile({file, userId}: {file: PortalMedia; userId: string}) {
  const {url, error} = useMediaUrl(file, false, userId);
  const size = `${Math.max(1, Math.round(file.size / 1024 / 1024 * 10) / 10)} MB`;
  return <figure>
    {url
      ? <a href={url} target="_blank" rel="noopener noreferrer">
        {file.type.startsWith('video/')
          ? <video src={url} muted preload="metadata"/>
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={url} alt={file.name}/>}
      </a>
      : <span className="ops-portal-media-pending">{error || 'Loading…'}</span>}
    <figcaption>{file.name}<small>{size}</small></figcaption>
  </figure>;
}
