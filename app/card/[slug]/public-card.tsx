"use client";
// Public digital business card. Adapted from Channel Cast OS app/card/[slug]/public-card.tsx.
import {useCallback, useEffect, useRef, useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Copy, Heart, Moon, Share2, Sun, UserPlus, X} from 'lucide-react';
import {CardPreview, hexAlpha, type CardAction} from '@/components/business-cards/card-preview';
import type {PublicBusinessCard} from '@/lib/business-cards/model';
import type {BusinessCardLink, EventType} from '@/lib/business-cards/types';

export function PublicCard({card, publicUrl}: {card: PublicBusinessCard; publicUrl: string}) {
  const links = [...card.links].sort((a, b) => a.display_order - b.display_order);
  const opener = card.sections.find(s => s.section_type === 'opener' && s.is_visible);
  const [showSplash, setShowSplash] = useState(Boolean(opener));
  const [light, setLight] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState('');
  const view = light ? {...card, background_color: '#f7f9fb', text_color: '#19202e', accent_color: '#63790d'} : card;

  const track = useCallback((eventType: EventType, linkId?: string) => {
    const body = JSON.stringify({cardId: card.id, eventType, linkId});
    // Beacons cannot carry JSON content type reliably, so use a keepalive fetch.
    fetch('/api/cards/events', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {});
  }, [card.id]);

  const open = (url: string, newTab = true) => { if (newTab) window.open(url, '_blank', 'noopener,noreferrer'); else window.location.href = url; };
  function handleAction(action: CardAction) {
    const sms = card.sms_phone || card.primary_phone;
    if (action === 'lead') return setLeadOpen(true);
    const target = action === 'call' ? card.primary_phone && `tel:${card.primary_phone}` : action === 'sms' ? sms && `sms:${sms}` : action === 'email' ? card.primary_email && `mailto:${card.primary_email}`
      : action === 'map' ? card.maps_url : action === 'website' ? card.website_url : card.intro_video_url;
    if (!target) return;
    track('link_click');
    open(target, ['map', 'website', 'video'].includes(action));
  }
  function handleLink(link: BusinessCardLink) {
    if (!link.url) return;
    track('link_click', link.id);
    open(link.url, link.open_in_new_tab && /^https?:/.test(link.url));
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(publicUrl); track('copy_link'); setStatus('Link copied.'); }
    catch { setStatus('Copy failed. Use your browser share menu instead.'); }
  }
  async function share() {
    if (!navigator.share) return copyLink();
    try { await navigator.share({title: card.display_name || 'Digital business card', url: publicUrl}); track('share'); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setStatus('Sharing failed.'); }
  }

  return (
    <main className="min-h-screen w-full px-4 py-8" style={{background: `radial-gradient(120% 60% at 50% 0%, ${hexAlpha(view.accent_color, 0.1)}, transparent 70%), ${view.background_color}`}}>
      {showSplash && opener && <Splash content={opener.content} card={view} onDone={() => setShowSplash(false)}/>}
      <div className="mx-auto max-w-sm">
        {card.theme_mode === 'both' && <div className="mb-3 flex justify-end">
          <button type="button" onClick={() => setLight(v => !v)} className="grid h-9 w-9 place-items-center rounded-full" style={{background: hexAlpha(view.text_color, 0.08), border: `1px solid ${hexAlpha(view.text_color, 0.14)}`, color: view.text_color}} aria-label={light ? 'Use dark colors' : 'Use light colors'}>
            {light ? <Moon aria-hidden className="h-4 w-4"/> : <Sun aria-hidden className="h-4 w-4"/>}
          </button>
        </div>}
        <CardPreview card={view} links={links} sections={card.sections} onAction={handleAction} onLink={handleLink}/>
        <div className="mt-5 flex items-center justify-center gap-2">
          <ActionButton icon={<Copy aria-hidden className="h-4 w-4"/>} label="Copy" onClick={copyLink} card={view}/>
          <ActionButton icon={<Share2 aria-hidden className="h-4 w-4"/>} label="Share" onClick={share} card={view}/>
          <ActionButton icon={<UserPlus aria-hidden className="h-4 w-4"/>} label="Save contact" onClick={() => { track('save_contact'); window.location.href = `/api/cards/vcf?slug=${encodeURIComponent(card.slug)}`; }} card={view}/>
          <ActionButton icon={<Heart aria-hidden className={liked ? 'h-4 w-4 fill-current' : 'h-4 w-4'}/>} label={liked ? 'Liked' : 'Like'} pressed={liked} onClick={() => { if (!liked) { setLiked(true); track('like'); } }} card={view}/>
        </div>
        <p role="status" aria-live="polite" className="mt-3 min-h-4 text-center text-xs" style={{color: hexAlpha(view.text_color, 0.7)}}>{status}</p>
      </div>
      {card.lead_form_settings.enabled && <LeadDialog card={view} open={leadOpen} onOpenChange={setLeadOpen}/>}
    </main>
  );
}

function ActionButton({icon, label, onClick, card, pressed}: {icon: React.ReactNode; label: string; onClick: () => void; card: PublicBusinessCard; pressed?: boolean}) {
  return <button type="button" aria-pressed={pressed} onClick={onClick} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium" style={{background: pressed ? card.accent_color : hexAlpha(card.text_color, 0.06), border: `1px solid ${pressed ? card.accent_color : hexAlpha(card.text_color, 0.14)}`, color: pressed ? card.background_color : card.accent_color}}>{icon}{label}</button>;
}

const youtubeId = (url: string) => /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/.exec(url)?.[1] ?? null;
const vimeoId = (url: string) => /vimeo\.com\/(?:video\/)?(\d+)/.exec(url)?.[1] ?? null;

function SplashVideo({content}: {content: Record<string, unknown>}) {
  const url = String(content.video_url || '');
  const start = Number(content.video_start || 0), end = Number(content.video_end || 0), muted = content.video_muted !== false;
  const ref = useRef<HTMLVideoElement>(null);
  const yt = youtubeId(url), vm = vimeoId(url);
  if (yt) {
    const params = new URLSearchParams({autoplay: '1', controls: '1', playsinline: '1', rel: '0', mute: muted ? '1' : '0'});
    if (start) params.set('start', String(start));
    if (end) params.set('end', String(end));
    return <iframe title="Intro video" className="aspect-video w-full max-w-2xl rounded-xl border-0" src={`https://www.youtube-nocookie.com/embed/${yt}?${params}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>;
  }
  if (vm) return <iframe title="Intro video" className="aspect-video w-full max-w-2xl rounded-xl border-0" src={`https://player.vimeo.com/video/${vm}?autoplay=1&muted=${muted ? 1 : 0}${start ? `#t=${start}s` : ''}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>;
  if (!url) return null;
  return <video ref={ref} src={url} className="w-full max-w-2xl rounded-xl" autoPlay playsInline muted={muted} controls
    onLoadedMetadata={() => { if (ref.current && start) ref.current.currentTime = start; }}
    onTimeUpdate={() => { if (ref.current && end && ref.current.currentTime >= end) ref.current.pause(); }}/>;
}

function SplashSlideshow({slides}: {slides: {id: string; image_url: string; caption?: string}[]}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI(p => (p + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  const slide = slides[i % slides.length];
  return <div className="relative w-full max-w-2xl overflow-hidden rounded-xl">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={slide.image_url} alt={slide.caption || ''} className="h-72 w-full object-cover"/>
    {slide.caption && <div className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-2 text-sm text-white">{slide.caption}</div>}
    {slides.length > 1 && <div className="absolute inset-x-0 top-2 flex justify-center gap-1.5">
      {slides.map((s, idx) => <button type="button" key={s.id} aria-label={`Show image ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} className={`h-2 rounded-full ${idx === i ? 'w-5 bg-white' : 'w-2 bg-white/60'}`}/>)}
    </div>}
  </div>;
}

function Splash({content, card, onDone}: {content: Record<string, unknown>; card: PublicBusinessCard; onDone: () => void}) {
  const accent = card.accent_color;
  const mode = String(content.mode || 'standard');
  const transition = String(content.transition || 'fade');
  const duration = Number(content.duration_seconds || 0);
  const slides = (Array.isArray(content.slides) ? content.slides : []) as {id: string; image_url: string; caption?: string}[];
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const close = useCallback(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setLeaving(true);
    window.setTimeout(onDone, reduce ? 0 : 450);
  }, [onDone]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const timer = duration > 0 ? setTimeout(close, duration * 1000) : undefined;
    return () => { cancelAnimationFrame(raf); if (timer) clearTimeout(timer); };
  }, [duration, close]);
  const active = shown && !leaving;
  const style: React.CSSProperties = transition === 'fade' ? {opacity: active ? 1 : 0}
    : transition === 'zoom' ? {opacity: active ? 1 : 0, transform: active ? 'scale(1)' : leaving ? 'scale(1.05)' : 'scale(0.95)'}
    : transition === 'slide-up' ? {transform: active ? 'translateY(0)' : leaving ? 'translateY(-100%)' : 'translateY(100%)'}
    : transition === 'slide-down' ? {transform: active ? 'translateY(0)' : leaving ? 'translateY(100%)' : 'translateY(-100%)'} : {};
  const primary = String(content.primary_label || 'View card');
  const secondary = String(content.secondary_label || (card.primary_phone ? 'Call me' : ''));
  const buttonStyle = {background: 'transparent', border: `1px solid ${hexAlpha(card.text_color, 0.3)}`, color: card.text_color};
  const primaryButton = <button type="button" autoFocus onClick={close} className="rounded-full px-6 py-2.5 text-sm font-semibold" style={{background: accent, color: card.background_color}}>{primary}</button>;
  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome" className="fixed inset-0 z-40 flex flex-col items-center justify-center px-6 text-center transition-all duration-[450ms] ease-out motion-reduce:transition-none" style={{background: card.background_color, color: card.text_color, ...style}}>
      {mode === 'video' ? <><SplashVideo content={content}/><div className="mt-6">{primaryButton}</div></>
        : mode === 'slideshow' ? <><SplashSlideshow slides={slides}/><div className="mt-6">{primaryButton}</div></>
        : <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {typeof content.logo_url === 'string' && content.logo_url && <img src={content.logo_url} alt="" className="mb-5" style={{
            width: Number(content.logo_size) || 80, height: Number(content.logo_size) || 80,
            borderRadius: content.logo_shape === 'square' ? 0 : content.logo_shape === 'rounded' ? 16 : 999,
            objectFit: content.logo_fit === 'contain' ? 'contain' : 'cover',
            border: content.logo_outline === false ? 'none' : `2px solid ${accent}`,
          }}/>}
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{opacity: 0.65}}>{String(content.eyebrow || 'Digital card')}</div>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{String(content.title || 'Welcome')}</h1>
          <p className="mt-2 text-sm" style={{opacity: 0.75}}>{String(content.subtitle || 'Tap to view my digital business card.')}</p>
          <div className="mt-6 flex gap-3">
            {primaryButton}
            {secondary && card.primary_phone && <a href={`tel:${card.primary_phone}`} className="rounded-full px-6 py-2.5 text-sm font-semibold" style={buttonStyle}>{secondary}</a>}
          </div>
        </>}
    </div>
  );
}

function LeadDialog({card, open, onOpenChange}: {card: PublicBusinessCard; open: boolean; onOpenChange: (open: boolean) => void}) {
  const settings = card.lead_form_settings;
  const fields = settings.fields.filter(f => f.enabled);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputStyle = {background: hexAlpha(card.text_color, 0.06), color: card.text_color, border: `1px solid ${hexAlpha(card.text_color, 0.2)}`};

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/cards/leads', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({cardId: card.id, ...values})});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Your details were not sent. Please try again.');
      setDone(true); setValues({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your details were not sent. Please try again.');
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog.Root open={open} onOpenChange={o => { onOpenChange(o); if (!o) { setDone(false); setError(''); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60"/>
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-5" style={{background: card.background_color, color: card.text_color, border: `1px solid ${hexAlpha(card.text_color, 0.2)}`}}>
          <Dialog.Close className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full opacity-70 hover:opacity-100" aria-label="Close"><X aria-hidden className="h-4 w-4"/></Dialog.Close>
          {done ? <div className="py-8 text-center">
            <Dialog.Title className="text-lg font-semibold">Thank you</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm" style={{opacity: 0.75}}>Your details were sent to {card.display_name || 'the card owner'}.</Dialog.Description>
            <Dialog.Close className="mt-5 rounded-full px-6 py-2 text-sm font-semibold" style={{background: card.accent_color, color: card.background_color}}>Close</Dialog.Close>
          </div> : <form onSubmit={submit}>
            <Dialog.Title className="pr-8 text-lg font-semibold">{settings.title || 'Send me your info'}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm" style={{opacity: 0.75}}>{settings.description || 'Share your details.'}</Dialog.Description>
            <div className="mt-4 space-y-2.5">
              {fields.map(f => <label key={f.key} className="block text-xs font-medium">
                <span>{f.label}{f.required && <span aria-hidden> *</span>}</span>
                {f.key === 'message'
                  ? <textarea required={f.required} maxLength={2000} rows={3} value={values[f.key] || ''} onChange={e => setValues(v => ({...v, [f.key]: e.target.value}))} className="mt-1 w-full resize-none rounded-lg px-3 py-2 text-sm" style={inputStyle}/>
                  : <input required={f.required} maxLength={f.key === 'email' ? 254 : 120} autoComplete={f.key === 'name' ? 'name' : f.key === 'email' ? 'email' : f.key === 'phone' ? 'tel' : 'organization'} type={f.key === 'email' ? 'email' : f.key === 'phone' ? 'tel' : 'text'} value={values[f.key] || ''} onChange={e => setValues(v => ({...v, [f.key]: e.target.value}))} className="mt-1 w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}/>}
              </label>)}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={values.website || ''} onChange={e => setValues(v => ({...v, website: e.target.value}))}/>
            </div>
            {error && <p role="alert" className="mt-3 rounded-lg px-3 py-2 text-xs" style={{background: hexAlpha('#d63b30', 0.18)}}>{error}</p>}
            <button type="submit" disabled={submitting} className="mt-4 w-full rounded-full py-2.5 text-sm font-semibold disabled:opacity-50" style={{background: card.accent_color, color: card.background_color}}>
              {submitting ? 'Sending…' : settings.submit_label || 'Send info'}
            </button>
          </form>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
