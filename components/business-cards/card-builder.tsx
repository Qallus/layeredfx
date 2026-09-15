"use client";
// Card builder, adapted from Channel Cast OS components/business-cards/card-builder.tsx.
import {useMemo, useRef, useState} from 'react';
import {
  ArrowDown, ArrowLeft, ArrowUp, ClipboardList, Copy, Eye, EyeOff, GalleryHorizontal, Image as ImageIcon, Layers,
  Link as LinkIcon, ListChecks, Palette, PlayCircle, Plus, QrCode, Save, Settings, Smartphone, Trash2, Upload, User, Wand2, Zap,
} from 'lucide-react';
import {Button} from '@/components/operations/shared';
import {useUnsavedChanges} from '@/components/operations/use-unsaved-changes';
import {cn} from '@/lib/layeredfx/utils';
import {BRAND_PALETTE, COLOR_PRESETS, LINK_TYPES, makeNewCard, publicCardUrl, uid, withBrandColors} from '@/lib/business-cards/model';
import type {Automation, AutomationAction, BusinessCard, BusinessCardLink, BusinessCardSection, MediaSettings, NfcStatus, OwnerOption, SectionType, SlideshowSlide, StepItem, ThemeMode} from '@/lib/business-cards/types';
import {CardPreview} from './card-preview';
import {CopyField, NfcWriter, useWebNfc} from './nfc-writer';

type PanelKey = 'sections' | 'content' | 'links' | 'color' | 'splash' | 'qr' | 'forms' | 'nfc' | 'slideshow' | 'media' | 'steps' | 'automate' | 'settings' | 'wizard';
const PANELS: {key: PanelKey; label: string; icon: React.ElementType}[] = [
  {key: 'content', label: 'Content', icon: User}, {key: 'sections', label: 'Sections', icon: Layers}, {key: 'links', label: 'Links', icon: LinkIcon},
  {key: 'color', label: 'Colors', icon: Palette}, {key: 'splash', label: 'Splash page', icon: PlayCircle}, {key: 'qr', label: 'QR code', icon: QrCode},
  {key: 'forms', label: 'Lead form', icon: ClipboardList}, {key: 'nfc', label: 'NFC', icon: Smartphone}, {key: 'slideshow', label: 'Slideshow', icon: GalleryHorizontal},
  {key: 'media', label: 'Media', icon: ImageIcon}, {key: 'steps', label: 'Steps', icon: ListChecks}, {key: 'automate', label: 'Automations', icon: Zap},
  {key: 'settings', label: 'Settings', icon: Settings}, {key: 'wizard', label: 'Setup checklist', icon: Wand2},
];
const inputCls = 'w-full';
type Setter = <K extends keyof BusinessCard>(key: K, value: BusinessCard[K]) => void;
type SectionsSetter = (update: (sections: BusinessCardSection[]) => BusinessCardSection[]) => void;
export type AutomationSupport = {email: boolean; sms: boolean};

const F = ({label, hint, children}: {label: string; hint?: string; children: React.ReactNode}) => (
  <label className="ops-field"><span>{label}</span>{children}{hint && <small className="text-[11px]">{hint}</small>}</label>
);
const Group = ({title, children}: {title: string; children: React.ReactNode}) => <section className="mb-5"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</section>;
const Toggle = ({on, onChange, label}: {on: boolean; onChange: () => void; label: [string, string]}) => (
  <Button type="button" variant="outline" size="sm" aria-pressed={on} onClick={onChange}>{on ? <Eye aria-hidden size={15}/> : <EyeOff aria-hidden size={15}/>}{on ? label[0] : label[1]}</Button>
);

/** Brand palette swatches only (docs/BRAND_COLORS.md); other colors are replaced when the card is saved. */
function ColorField({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  const current = BRAND_PALETTE.find(c => c.hex === value.toLowerCase());
  return <div className="ops-field"><span>{label} — {current ? current.name : 'Not a brand color'}</span>
    <div role="radiogroup" aria-label={label} className="bc-swatches">
      {BRAND_PALETTE.map(c => <button type="button" role="radio" key={c.hex} aria-checked={current?.hex === c.hex} aria-label={c.name} title={`${c.name} ${c.hex}`}
        className="bc-swatch" style={{background: c.hex}} onClick={() => onChange(c.hex)}/>)}
    </div>
  </div>;
}

async function uploadImage(file: File): Promise<string> {
  const res = await fetch('/api/admin/business-cards/uploads', {method: 'POST', headers: {'Content-Type': file.type}, body: file});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed.');
  return data.url;
}

function ImageField({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  return <div className="ops-field">
    <span>{label}</span>
    <div className="flex items-center gap-2">
      {value
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={value} alt="" className="h-10 w-10 shrink-0 rounded object-cover"/>
        : <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-muted"><ImageIcon aria-hidden size={16}/></div>}
      <input aria-label={`${label} URL`} placeholder="https://… image URL" value={value} onChange={e => onChange(e.target.value)} className={inputCls}/>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        setBusy(true); setError('');
        try { onChange(await uploadImage(file)); } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed.'); } finally { setBusy(false); }
      }}/>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload aria-hidden size={14}/>{busy ? 'Uploading…' : 'Upload'}</Button>
      {value && <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>Remove</Button>}
    </div>
    {error && <small role="alert" className="text-[#d63b30]">{error}</small>}
  </div>;
}

export function CardBuilder({card, actor, ownerOptions, siteUrl, automations, onClose, onSaved}: {
  card: BusinessCard | null;
  actor: {id: string; name: string; email: string | null; role: string};
  ownerOptions: OwnerOption[];
  siteUrl: string;
  automations: AutomationSupport;
  onClose: () => void;
  onSaved: (card: BusinessCard) => void;
}) {
  // Pre-palette cards open with brand colors so the editor, preview and saved card agree.
  const initial = useMemo(() => card ? withBrandColors(card) : makeNewCard({id: actor.id, name: actor.name, email: actor.email ?? undefined}), [card, actor]);
  const [draft, setDraft] = useState<BusinessCard>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [panel, setPanel] = useState<PanelKey>('content');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dirty = JSON.stringify(draft) !== saved;
  useUnsavedChanges(dirty);
  const set: Setter = (key, value) => setDraft(d => ({...d, [key]: value}));
  const setSections: SectionsSetter = update => setDraft(d => ({...d, sections: update(d.sections).map((s, i) => ({...s, display_order: i + 1}))}));
  const publicUrl = publicCardUrl(siteUrl, draft.slug);
  const writable = actor.role !== 'viewer';

  async function persist(status?: BusinessCard['status']) {
    setSaving(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/business-cards', {method: draft.id ? 'PATCH' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...draft, ...(status ? {status} : {})})});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'The card was not saved.');
      setDraft(data.card); setSaved(JSON.stringify(data.card));
      setNotice(data.card.status === 'published' ? 'Saved and published.' : 'Saved.');
      onSaved(data.card);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The card was not saved.');
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="ops-toolbar border-b pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { if (!dirty || confirm('Discard unsaved card changes?')) onClose(); }}><ArrowLeft aria-hidden size={15}/> Back</Button>
          <h1 className="m-0 text-lg font-semibold">{draft.id ? `Edit ${draft.card_name}` : 'New business card'}</h1>
          {dirty && <span className="ops-badge">Unsaved</span>}
        </div>
        <div className="ops-actions">
          {draft.id && <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(publicUrl).then(() => setNotice('Public URL copied.'), () => setError('Copy failed.'))}><Copy aria-hidden size={14}/> Copy URL</Button>}
          {draft.id && draft.status === 'published' && !dirty && <Button size="sm" variant="outline" asChild><a href={publicUrl} target="_blank" rel="noopener noreferrer"><Eye aria-hidden size={14}/> Public page</a></Button>}
          <Button size="sm" variant="outline" onClick={() => persist('published')} disabled={saving || !writable}>Save &amp; publish</Button>
          <Button size="sm" onClick={() => persist()} disabled={saving || !writable}><Save aria-hidden size={14}/>{saving ? 'Saving…' : 'Save card'}</Button>
        </div>
      </div>
      {error && <p role="alert" className="ops-error mt-3">{error}</p>}
      {notice && <p role="status" className="ops-info mt-3">{notice}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-[160px_minmax(0,380px)_minmax(0,1fr)]">
        <nav aria-label="Card builder panels" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {PANELS.map(({key, label, icon: Icon}) => (
            <button key={key} type="button" aria-current={panel === key ? 'true' : undefined} onClick={() => setPanel(key)}
              className={cn('flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border-0 px-3 py-2 text-left text-xs font-medium', panel === key ? 'bg-[#f5ffcc] text-[#63790d]' : 'bg-transparent text-[#47536b] hover:bg-[#eef1f5]')}>
              <Icon aria-hidden size={15}/>{label}
            </button>
          ))}
        </nav>
        <div className="ops-panel mb-0 self-start"><div className="ops-panel-body">
          <fieldset disabled={!writable} className="m-0 min-w-0 border-0 p-0">
            <PanelBody panel={panel} draft={draft} set={set} setDraft={setDraft} setSections={setSections} actor={actor} ownerOptions={ownerOptions} siteUrl={siteUrl} automations={automations}/>
          </fieldset>
        </div></div>
        <div className="rounded-[9px] border bg-[#eef1f5] p-4">
          <div className="ops-panel-head mb-3 border-0 p-0"><h2>Live preview</h2>
            <div className="ops-views" aria-label="Preview width">{(['mobile', 'tablet', 'desktop'] as const).map(d => <button type="button" key={d} aria-pressed={device === d} className={device === d ? 'active' : ''} onClick={() => setDevice(d)}>{d}</button>)}</div>
          </div>
          <div className={cn('mx-auto w-full', device === 'mobile' ? 'max-w-[360px]' : device === 'tablet' ? 'max-w-[460px]' : 'max-w-[560px]')}>
            <CardPreview card={draft} links={draft.links} sections={draft.sections}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelBody({panel, draft, set, setDraft, setSections, actor, ownerOptions, siteUrl, automations}: {
  panel: PanelKey; draft: BusinessCard; set: Setter; setDraft: React.Dispatch<React.SetStateAction<BusinessCard>>; setSections: SectionsSetter;
  actor: {id: string; role: string}; ownerOptions: OwnerOption[]; siteUrl: string; automations: AutomationSupport;
}) {
  const sections = draft.sections;
  const textField = (label: string, key: keyof BusinessCard, props: React.InputHTMLAttributes<HTMLInputElement> = {}) =>
    <F label={label}><input className={inputCls} maxLength={120} value={String(draft[key] ?? '')} onChange={e => set(key, e.target.value as never)} {...props}/></F>;
  const section = (type: SectionType) => sections.find(s => s.section_type === type);
  const setContent = (type: SectionType, patch: Record<string, unknown>) => setSections(list => list.map(s => s.section_type === type ? {...s, content: {...s.content, ...patch}} : s));
  const toggleSection = (type: SectionType, visible?: boolean) => setSections(list => list.map(s => s.section_type === type ? {...s, is_visible: visible ?? !s.is_visible} : s));

  switch (panel) {
    case 'content': return <>
      <Group title="Profile">
        <ImageField label="Profile photo" value={draft.profile_photo_url} onChange={v => set('profile_photo_url', v)}/>
        <ImageField label="Logo (optional)" value={draft.logo_url} onChange={v => set('logo_url', v)}/>
        {textField('Display name', 'display_name')}
        <div className="ops-form-grid">{textField('First name', 'first_name', {maxLength: 80})}{textField('Last name', 'last_name', {maxLength: 80})}</div>
        {textField('Job title', 'job_title')}{textField('Company', 'company_name')}{textField('Department', 'department')}
        <F label="Bio"><textarea maxLength={1000} value={draft.bio} onChange={e => set('bio', e.target.value)}/></F>
      </Group>
      <Group title="Contact">
        {textField('Phone', 'primary_phone', {type: 'tel', maxLength: 40, placeholder: '+1 480 555 0100'})}
        {textField('Text message number', 'sms_phone', {type: 'tel', maxLength: 40})}
        {textField('Email', 'primary_email', {type: 'email', maxLength: 254})}
        {textField('Website', 'website_url', {type: 'url', maxLength: 2000, placeholder: 'https://'})}
        {textField('Map / directions URL', 'maps_url', {type: 'url', maxLength: 2000})}
        {textField('Intro video URL', 'intro_video_url', {type: 'url', maxLength: 2000, placeholder: 'YouTube, Vimeo or .mp4 link'})}
      </Group>
    </>;

    case 'sections': return <Group title="Sections">
      <p className="ops-muted">Show, hide, reorder and space the sections on the public card. The splash page is controlled in its own panel.</p>
      {sections.map((s, i) => s.section_type === 'opener' ? null : <div key={s.id} className="mb-2 rounded-lg border p-2.5">
        <div className="flex items-center gap-1">
          <span className="flex-1 text-sm font-medium">{s.label}</span>
          <Button type="button" size="icon" variant="ghost" aria-label={`Move ${s.label} up`} disabled={i <= 1} onClick={() => setSections(list => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}><ArrowUp aria-hidden size={15}/></Button>
          <Button type="button" size="icon" variant="ghost" aria-label={`Move ${s.label} down`} disabled={i === sections.length - 1} onClick={() => setSections(list => { const n = [...list]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}><ArrowDown aria-hidden size={15}/></Button>
          <Button type="button" size="icon" variant="ghost" aria-pressed={s.is_visible} aria-label={`${s.is_visible ? 'Hide' : 'Show'} ${s.label}`} onClick={() => toggleSection(s.section_type)}>{s.is_visible ? <Eye aria-hidden size={15}/> : <EyeOff aria-hidden size={15}/>}</Button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-[11px]">Space below
          <input type="range" min={0} max={48} value={s.margin_bottom} onChange={e => setSections(list => list.map(x => x.id === s.id ? {...x, margin_bottom: Number(e.target.value)} : x))} className="flex-1"/>
          <span className="w-8 text-right">{s.margin_bottom}px</span>
        </label>
      </div>)}
    </Group>;

    case 'links': {
      const update = (id: string, patch: Partial<BusinessCardLink>) => set('links', draft.links.map(l => l.id === id ? {...l, ...patch} : l));
      const move = (i: number, dir: -1 | 1) => { const n = [...draft.links]; if (!n[i + dir]) return; [n[i], n[i + dir]] = [n[i + dir], n[i]]; set('links', n.map((l, j) => ({...l, display_order: j + 1}))); };
      return <Group title="Links & socials">
        <p className="ops-muted">Buttons in the Links section. Use https://, mailto:, tel: or sms: links.</p>
        {draft.links.map((l, i) => <div key={l.id} className="mb-2 rounded-lg border p-2.5">
          <div className="mb-2 flex items-center gap-1">
            <input aria-label="Link label" className={inputCls} maxLength={80} value={l.label} onChange={e => update(l.id, {label: e.target.value})} placeholder="Label"/>
            <Button type="button" size="icon" variant="ghost" aria-label={`Move ${l.label} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp aria-hidden size={15}/></Button>
            <Button type="button" size="icon" variant="ghost" aria-label={`Move ${l.label} down`} disabled={i === draft.links.length - 1} onClick={() => move(i, 1)}><ArrowDown aria-hidden size={15}/></Button>
            <Button type="button" size="icon" variant="ghost" aria-pressed={l.is_visible} aria-label={`${l.is_visible ? 'Hide' : 'Show'} ${l.label}`} onClick={() => update(l.id, {is_visible: !l.is_visible})}>{l.is_visible ? <Eye aria-hidden size={15}/> : <EyeOff aria-hidden size={15}/>}</Button>
            <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${l.label}`} onClick={() => set('links', draft.links.filter(x => x.id !== l.id))}><Trash2 aria-hidden size={15}/></Button>
          </div>
          <input aria-label="Link URL" className={cn(inputCls, 'mb-2')} maxLength={2000} value={l.url} onChange={e => update(l.id, {url: e.target.value})} placeholder="https://…"/>
          {!l.url.trim() && <p className="mb-2 text-[11px] text-[#d63b30]">No valid URL — this link is hidden on the public card. Unsupported links are removed when you save.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <select aria-label="Link type" value={l.link_type} onChange={e => update(l.id, {link_type: e.target.value as BusinessCardLink['link_type']})}>{LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <label className="ops-inline"><input type="checkbox" checked={l.open_in_new_tab} onChange={e => update(l.id, {open_in_new_tab: e.target.checked})}/> New tab</label>
          </div>
        </div>)}
        <Button type="button" size="sm" variant="outline" disabled={draft.links.length >= 30} onClick={() => set('links', [...draft.links, {id: uid(), label: 'New link', url: '', link_type: 'custom', display_order: draft.links.length + 1, is_visible: true, open_in_new_tab: true}])}><Plus aria-hidden size={14}/> Add link</Button>
      </Group>;
    }

    case 'color': return <Group title="Colors & theme">
      <F label="Visitor theme"><select value={draft.theme_mode} onChange={e => set('theme_mode', e.target.value as ThemeMode)}>
        <option value="dark">Card colors only</option><option value="light">Light card colors</option><option value="both">Let visitors switch to light</option>
      </select></F>
      <div className="mb-4"><div className="mb-1.5 text-[11px] font-medium">Presets</div><div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map(p => <Button type="button" key={p.name} size="sm" variant="outline" onClick={() => setDraft(d => ({...d, background_color: p.bg, accent_color: p.accent, text_color: p.text}))}>
          <span aria-hidden className="h-3 w-3 rounded-full" style={{background: p.bg, border: `2px solid ${p.accent}`}}/>{p.name}</Button>)}
      </div></div>
      <ColorField label="Background" value={draft.background_color} onChange={v => set('background_color', v)}/>
      <ColorField label="Accent" value={draft.accent_color} onChange={v => set('accent_color', v)}/>
      <ColorField label="Text" value={draft.text_color} onChange={v => set('text_color', v)}/>
    </Group>;

    case 'splash': {
      const opener = section('opener');
      const c = (opener?.content || {}) as Record<string, unknown>;
      const mode = String(c.mode || 'standard');
      const str = (k: string) => String(c[k] ?? '');
      const put = (patch: Record<string, unknown>) => setContent('opener', patch);
      return <Group title="Splash / opener page">
        <div className="mb-4"><Toggle on={Boolean(opener?.is_visible)} onChange={() => toggleSection('opener')} label={['Splash enabled', 'Splash disabled']}/></div>
        <div className="ops-form-grid">
          <F label="Auto-close after (seconds)" hint="0 = stay until tapped"><input type="number" min={0} max={60} value={Number(c.duration_seconds || 0)} onChange={e => put({duration_seconds: Number(e.target.value)})}/></F>
          <F label="Transition"><select value={str('transition') || 'fade'} onChange={e => put({transition: e.target.value})}>
            <option value="none">None</option><option value="fade">Fade</option><option value="slide-up">Slide up</option><option value="slide-down">Slide down</option><option value="zoom">Zoom</option>
          </select></F>
        </div>
        <div className="ops-views mb-4" aria-label="Splash type">{[['standard', 'Standard'], ['video', 'Video'], ['slideshow', 'Slideshow']].map(([key, label]) => <button type="button" key={key} aria-pressed={mode === key} className={mode === key ? 'active' : ''} onClick={() => put({mode: key})}>{label}</button>)}</div>
        {mode === 'standard' && <>
          <ImageField label="Logo or photo" value={str('logo_url')} onChange={v => put({logo_url: v})}/>
          {([['eyebrow', 'Eyebrow', 'Digital card'], ['title', 'Title', 'Welcome'], ['subtitle', 'Subtitle', 'Tap to view my digital business card.'], ['primary_label', 'Primary button', 'View card'], ['secondary_label', 'Secondary button (calls your phone)', 'Call me']] as const)
            .map(([key, label, placeholder]) => <F key={key} label={label}><input maxLength={key === 'subtitle' ? 200 : 80} value={str(key)} placeholder={placeholder} onChange={e => put({[key]: e.target.value})}/></F>)}
        </>}
        {mode === 'video' && <>
          <F label="Video URL" hint="YouTube, Vimeo, or a direct .mp4/.webm link"><input value={str('video_url')} maxLength={2000} placeholder="https://…" onChange={e => put({video_url: e.target.value})}/></F>
          <div className="ops-form-grid">
            <F label="Start (seconds)"><input type="number" min={0} value={Number(c.video_start || 0)} onChange={e => put({video_start: Number(e.target.value)})}/></F>
            <F label="End (seconds)" hint="0 = play to end"><input type="number" min={0} value={Number(c.video_end || 0)} onChange={e => put({video_end: Number(e.target.value)})}/></F>
          </div>
          <label className="ops-inline"><input type="checkbox" checked={c.video_muted === false} onChange={e => put({video_muted: !e.target.checked})}/> Play with audio</label>
          <p className="ops-muted mt-1">Browsers usually block autoplay with sound; visitors may need to tap to hear it.</p>
        </>}
        {mode === 'slideshow' && <SlideEditor slides={(Array.isArray(c.slides) ? c.slides : []) as SlideshowSlide[]} onChange={slides => put({slides})}/>}
        <F label="Primary button label" hint="Shown under video and slideshow splashes."><input maxLength={40} value={str('primary_label')} placeholder="View card" onChange={e => put({primary_label: e.target.value})}/></F>
      </Group>;
    }

    case 'qr': {
      const fg = draft.qr_settings.foreground || '#19202e';
      return <Group title="QR code">
        {draft.id && draft.slug ? <>
          <div className="mb-3 flex justify-center rounded-lg border bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/cards/qr?slug=${encodeURIComponent(draft.slug)}&source=qr&size=320&fg=${encodeURIComponent(fg)}`} alt="QR code preview" className="h-40 w-40"/>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full"><a href={`/api/cards/qr?slug=${encodeURIComponent(draft.slug)}&source=qr&size=1024&download=1&fg=${encodeURIComponent(fg)}`}><QrCode aria-hidden size={14}/> Download PNG</a></Button>
        </> : <p className="ops-info">Save the card to create its public URL and QR code.</p>}
        <div className="mt-4"><ColorField label="QR color" value={fg} onChange={v => set('qr_settings', {...draft.qr_settings, foreground: v})}/></div>
        <p className="ops-muted">The QR code opens the public card and is counted as a QR scan. Keep a dark color on the white background so phones can read it. Save to apply color changes.</p>
      </Group>;
    }

    case 'forms': {
      const lf = draft.lead_form_settings;
      const put = (patch: Partial<typeof lf>) => set('lead_form_settings', {...lf, ...patch});
      return <Group title="Lead capture form">
        <div className="mb-4"><Toggle on={lf.enabled} onChange={() => put({enabled: !lf.enabled})} label={['Form enabled', 'Form disabled']}/></div>
        <F label="Form title"><input maxLength={120} value={lf.title} onChange={e => put({title: e.target.value})}/></F>
        <F label="Description"><input maxLength={400} value={lf.description} onChange={e => put({description: e.target.value})}/></F>
        <div className="ops-form-grid">
          <F label="Card button label"><input maxLength={60} value={lf.button_label} onChange={e => put({button_label: e.target.value})}/></F>
          <F label="Submit button label"><input maxLength={60} value={lf.submit_label} onChange={e => put({submit_label: e.target.value})}/></F>
        </div>
        <div className="mb-1.5 text-[11px] font-medium">Fields</div>
        {lf.fields.map((field, i) => <div key={field.key} className="mb-1.5 flex flex-wrap items-center gap-3 rounded-md border px-2.5 py-1.5 text-sm">
          <input aria-label={`${field.key} label`} className="min-w-0 flex-1" maxLength={60} value={field.label} onChange={e => put({fields: lf.fields.map((f, j) => j === i ? {...f, label: e.target.value} : f)})}/>
          <label className="ops-inline"><input type="checkbox" checked={field.enabled} onChange={e => put({fields: lf.fields.map((f, j) => j === i ? {...f, enabled: e.target.checked, required: e.target.checked && f.required} : f)})}/> Show</label>
          <label className="ops-inline"><input type="checkbox" checked={field.required} disabled={!field.enabled} onChange={e => put({fields: lf.fields.map((f, j) => j === i ? {...f, required: e.target.checked} : f)})}/> Required</label>
        </div>)}
        <p className="ops-muted mt-2">Submissions land in the Leads tab. Convert them into LayeredFX leads or opportunities from there.</p>
      </Group>;
    }

    case 'nfc': return <NfcPanel draft={draft} set={set} siteUrl={siteUrl} nfcSection={section('nfc')} toggle={() => toggleSection('nfc')}/>;

    case 'slideshow': {
      const s = section('slideshow');
      return <Group title="Slideshow">
        <p className="ops-muted">A swipeable image gallery on the card. Use only images you have the right to publish.</p>
        <div className="mb-3"><Toggle on={Boolean(s?.is_visible)} onChange={() => toggleSection('slideshow')} label={['Visible on card', 'Hidden']}/></div>
        <SlideEditor slides={(Array.isArray(s?.content?.slides) ? s!.content.slides : []) as SlideshowSlide[]} onChange={slides => setContent('slideshow', {slides})}/>
      </Group>;
    }

    case 'media': {
      const m = draft.media_settings;
      const put = (patch: Partial<MediaSettings>) => setDraft(d => ({...d, media_settings: {...d.media_settings, ...patch}}));
      return <>
        <Group title="Logo size">
          <F label={`Height — ${m.logo_height || 24}px`}><input type="range" min={12} max={120} value={m.logo_height || 24} onChange={e => put({logo_height: Number(e.target.value)})}/></F>
          <F label={m.logo_width ? `Max width — ${m.logo_width}px` : 'Max width — auto'} hint="0 = auto; the aspect ratio is kept."><input type="range" min={0} max={320} value={m.logo_width || 0} onChange={e => put({logo_width: Number(e.target.value)})}/></F>
          <F label="Logo links to (optional)"><input type="url" maxLength={2000} value={m.logo_link_url ?? ''} onChange={e => put({logo_link_url: e.target.value})} placeholder="https://…"/></F>
        </Group>
        <Group title="Background">
          <ImageField label="Background image" value={draft.background_image_url} onChange={v => set('background_image_url', v)}/>
          <label className="ops-inline"><input type="checkbox" checked={Boolean(m.use_background_image)} onChange={e => put({use_background_image: e.target.checked})}/> Use background image with a color overlay</label>
        </Group>
        <Group title="Profile image">
          <F label="Shape"><select value={m.profile_shape || 'circle'} onChange={e => put({profile_shape: e.target.value as MediaSettings['profile_shape']})}><option value="circle">Circle</option><option value="rounded">Rounded</option><option value="square">Square</option></select></F>
          <label className="ops-inline mb-3"><input type="checkbox" checked={Boolean(m.profile_outline)} onChange={e => put({profile_outline: e.target.checked})}/> Outline around photo</label>
          {m.profile_outline && <ColorField label="Outline color" value={m.profile_outline_color || draft.accent_color} onChange={v => put({profile_outline_color: v})}/>}
          <F label="Photo links to (optional)"><input type="url" maxLength={2000} value={m.profile_link_url ?? ''} onChange={e => put({profile_link_url: e.target.value})} placeholder="https://…"/></F>
          <label className="ops-switch mb-3"><input type="checkbox" role="switch" checked={Boolean(m.profile_spacing)} onChange={e => put({profile_spacing: e.target.checked})}/><span aria-hidden/>Margin options</label>
          {m.profile_spacing && <div className="ops-form-grid">
            <F label={`Margin top — ${m.profile_margin_top ?? 0}px`}><input type="range" min={0} max={96} step={2} value={m.profile_margin_top ?? 0} onChange={e => put({profile_margin_top: Number(e.target.value)})}/></F>
            <F label={`Margin bottom — ${m.profile_margin_bottom ?? 12}px`}><input type="range" min={0} max={96} step={2} value={m.profile_margin_bottom ?? 12} onChange={e => put({profile_margin_bottom: Number(e.target.value)})}/></F>
          </div>}
        </Group>
        <Group title="Layout">
          <F label="Profile alignment"><select value={m.content_align || 'center'} onChange={e => put({content_align: e.target.value as MediaSettings['content_align']})}><option value="center">Centered</option><option value="left">Left aligned</option></select></F>
        </Group>
      </>;
    }

    case 'steps': {
      const s = section('steps');
      const steps = (Array.isArray(s?.content?.steps) ? s!.content.steps : []) as StepItem[];
      const put = (next: StepItem[]) => setContent('steps', {steps: next});
      return <Group title="Steps / how it works">
        <p className="ops-muted">An ordered list — for example how a LayeredFX consultation works.</p>
        <div className="ops-toolbar"><Toggle on={Boolean(s?.is_visible)} onChange={() => toggleSection('steps')} label={['Visible', 'Hidden']}/>
          <Button type="button" size="sm" variant="outline" disabled={steps.length >= 20} onClick={() => { put([...steps, {id: uid(), title: 'New step', description: ''}]); toggleSection('steps', true); }}><Plus aria-hidden size={14}/> Add step</Button></div>
        {steps.map((st, i) => <div key={st.id} className="mb-2 rounded-lg border p-2.5">
          <div className="mb-1.5 flex items-center gap-2">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f5ffcc] text-[11px] font-bold">{i + 1}</span>
            <input aria-label={`Step ${i + 1} title`} className={inputCls} maxLength={120} value={st.title} onChange={e => put(steps.map((x, j) => j === i ? {...x, title: e.target.value} : x))}/>
            <Button type="button" size="icon" variant="ghost" aria-label={`Remove step ${i + 1}`} onClick={() => put(steps.filter((_, j) => j !== i))}><Trash2 aria-hidden size={15}/></Button>
          </div>
          <textarea aria-label={`Step ${i + 1} description`} maxLength={500} placeholder="Description (optional)" value={st.description || ''} onChange={e => put(steps.map((x, j) => j === i ? {...x, description: e.target.value} : x))}/>
        </div>)}
      </Group>;
    }

    case 'automate': return <AutomationsPanel draft={draft} set={set} support={automations}/>;

    case 'settings': return <Group title="Card settings">
      <F label="Card name (internal)"><input maxLength={120} value={draft.card_name} onChange={e => set('card_name', e.target.value)}/></F>
      <F label="Public URL" hint={draft.id ? 'Changing this breaks printed QR codes and written NFC tags that use the old URL.' : 'Leave blank to generate one from the display name.'}>
        <div className="flex items-center gap-1 text-sm"><span className="shrink-0 text-[#47536b]">/card/</span>
          <input className={inputCls} maxLength={60} value={draft.slug} onChange={e => set('slug', e.target.value.toLowerCase())} placeholder="auto" pattern="[a-z0-9-]*"/></div>
      </F>
      <F label="Status"><select value={draft.status} onChange={e => set('status', e.target.value as BusinessCard['status'])}>
        <option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option>
      </select></F>
      {actor.role === 'admin' && <F label="Card owner" hint="Owners see and manage their card and its leads. Only administrators can reassign.">
        <select value={draft.owner_id ?? ''} onChange={e => { const o = ownerOptions.find(x => x.id === e.target.value); setDraft(d => ({...d, owner_id: o?.id ?? null, owner_name: o?.name ?? null, owner_email: o?.email ?? null})); }}>
          <option value="">Unassigned (administrators only)</option>
          {ownerOptions.map(o => <option key={o.id} value={o.id}>{o.name}{o.email ? ` (${o.email})` : ''}</option>)}
        </select>
      </F>}
    </Group>;

    case 'wizard': {
      const steps = [
        {done: Boolean(draft.display_name), label: 'Add your name and title', panel: 'content'},
        {done: Boolean(draft.profile_photo_url), label: 'Add a profile photo', panel: 'content'},
        {done: Boolean(draft.primary_phone || draft.primary_email), label: 'Add contact details', panel: 'content'},
        {done: draft.links.some(l => l.url) || Boolean(draft.website_url), label: 'Add at least one link', panel: 'links'},
        {done: draft.lead_form_settings.enabled, label: 'Enable lead capture', panel: 'forms'},
        {done: Boolean(draft.id) && draft.status === 'published', label: 'Save and publish the card', panel: 'settings'},
      ];
      return <Group title="Setup checklist">
        <ol className="m-0 list-none p-0">{steps.map((s, i) => <li key={s.label} className="mb-2 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <span aria-hidden className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]', s.done ? 'bg-[#d6ff41] text-[#19202e]' : 'border')}>{s.done ? '✓' : i + 1}</span>
          <span className={cn('flex-1', s.done && 'line-through opacity-60')}>{s.label}<span className="sr-only">{s.done ? ' (done)' : ' (to do)'}</span></span>
        </li>)}</ol>
        <p className="ops-muted">{steps.filter(s => s.done).length} of {steps.length} complete.</p>
      </Group>;
    }
  }
}

function SlideEditor({slides, onChange}: {slides: SlideshowSlide[]; onChange: (next: SlideshowSlide[]) => void}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [urlText, setUrlText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function addUrls() {
    const urls = urlText.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    if (!urls.length) return;
    onChange([...slides, ...urls.map(u => ({id: uid(), image_url: u, caption: ''}))].slice(0, 20));
    setUrlText('');
  }
  const move = (i: number, dir: -1 | 1) => { const n = [...slides]; if (!n[i + dir]) return; [n[i], n[i + dir]] = [n[i + dir], n[i]]; onChange(n); };
  return <div>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={async e => {
        const files = Array.from(e.target.files || []); e.target.value = '';
        if (!files.length) return;
        setBusy(true); setError('');
        const added: SlideshowSlide[] = [];
        for (const f of files) { try { added.push({id: uid(), image_url: await uploadImage(f), caption: ''}); } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed.'); break; } }
        setBusy(false);
        if (added.length) onChange([...slides, ...added].slice(0, 20));
      }}/>
      <Button type="button" size="sm" variant="outline" disabled={busy || slides.length >= 20} onClick={() => input.current?.click()}><Upload aria-hidden size={14}/>{busy ? 'Uploading…' : 'Upload images'}</Button>
      <span className="ops-muted">{slides.length} of 20 images</span>
    </div>
    {error && <p role="alert" className="ops-error">{error}</p>}
    <div className="mb-3 flex gap-2">
      <input aria-label="Image URLs" className={inputCls} placeholder="Paste image URL(s)" value={urlText} onChange={e => setUrlText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrls(); } }}/>
      <Button type="button" size="sm" variant="outline" onClick={addUrls} disabled={!urlText.trim()}><Plus aria-hidden size={14}/> Add</Button>
    </div>
    {!slides.length && <p className="ops-muted">No images yet.</p>}
    {slides.map((sl, i) => <div key={sl.id} className="mb-2 flex items-center gap-1 rounded-lg border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sl.image_url} alt="" className="h-12 w-12 shrink-0 rounded object-cover"/>
      <input aria-label={`Image ${i + 1} caption`} className={inputCls} maxLength={160} placeholder="Caption / alt text" value={sl.caption || ''} onChange={e => onChange(slides.map((x, j) => j === i ? {...x, caption: e.target.value} : x))}/>
      <Button type="button" size="icon" variant="ghost" aria-label={`Move image ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp aria-hidden size={14}/></Button>
      <Button type="button" size="icon" variant="ghost" aria-label={`Move image ${i + 1} down`} disabled={i === slides.length - 1} onClick={() => move(i, 1)}><ArrowDown aria-hidden size={14}/></Button>
      <Button type="button" size="icon" variant="ghost" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(slides.filter((_, j) => j !== i))}><Trash2 aria-hidden size={14}/></Button>
    </div>)}
  </div>;
}

function NfcPanel({draft, set, siteUrl, nfcSection, toggle}: {draft: BusinessCard; set: Setter; siteUrl: string; nfcSection?: BusinessCardSection; toggle: () => void}) {
  const supported = useWebNfc();
  const url = publicCardUrl(siteUrl, draft.slug, 'nfc');
  return <Group title="NFC tap-to-share">
    <F label="NFC status"><select value={draft.nfc_status} onChange={e => set('nfc_status', e.target.value as NfcStatus)}>
      <option value="not_ordered">Not ordered</option><option value="ordered">Ordered</option><option value="assigned">Assigned to a tag</option><option value="active">Active</option>
    </select></F>
    {draft.id && draft.slug ? <>
      <div className="ops-field"><span>Tag URL</span><CopyField label="Tag URL" value={url}/><small>Program NFC items to open this URL. Taps are counted as NFC taps.</small></div>
      {supported === null ? null : supported
        ? <NfcWriter url={url} onWritten={() => set('nfc_status', 'active')}/>
        : <p className="ops-muted">Web NFC works in Chrome on Android. From the card list, <b>Write NFC</b> shows a QR code that opens a write page on your phone.</p>}
      {supported && <p className="ops-muted mt-2">Save the card after writing to keep the Active status.</p>}
    </> : <p className="ops-info">Save the card first so the tag URL is final.</p>}
    <div className="mt-4"><Toggle on={Boolean(nfcSection?.is_visible)} onChange={toggle} label={['Showing tap-to-share note', 'Show tap-to-share note on card']}/></div>
  </Group>;
}

const AUTOMATION_ACTIONS: {action: AutomationAction; label: string; desc: string; channel: keyof AutomationSupport; hasMessage?: boolean}[] = [
  {action: 'notify_owner_sms', label: 'Text me on new lead', desc: "Send an SMS to the card's text or phone number (with country code, e.g. +1…) when a lead comes in.", channel: 'sms'},
  {action: 'notify_owner_email', label: 'Email me on new lead', desc: 'Email the card owner when a lead comes in.', channel: 'email'},
  {action: 'autoreply_email', label: 'Auto-reply to the lead', desc: 'Send a thank-you email to leads who share an email address.', channel: 'email', hasMessage: true},
];

function AutomationsPanel({draft, set, support}: {draft: BusinessCard; set: Setter; support: AutomationSupport}) {
  const ruleFor = (action: AutomationAction) => draft.automations.find(a => a.action === action);
  const setRule = (action: AutomationAction, patch: Partial<Automation>) => {
    const existing = ruleFor(action);
    set('automations', existing ? draft.automations.map(a => a.action === action ? {...a, ...patch} : a) : [...draft.automations, {id: uid(), trigger: 'lead_submit', action, enabled: false, ...patch}]);
  };
  return <Group title="Automations">
    <p className="ops-muted">Run actions when someone submits the lead form. Every lead is stored in the Leads tab regardless.</p>
    {AUTOMATION_ACTIONS.map(a => {
      const rule = ruleFor(a.action);
      const available = support[a.channel];
      return <div key={a.action} className="mb-2 rounded-lg border p-3">
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" disabled={!available} checked={Boolean(rule?.enabled) && available} onChange={e => setRule(a.action, {enabled: e.target.checked})}/>
          <span><span className="block text-sm font-medium">{a.label}</span><span className="block text-[11px] text-[#47536b]">{a.desc}</span>
            {!available && <span className="mt-1 block text-[11px] text-[#d63b30]">{a.channel === 'email' ? 'Unavailable: LayeredFX has no email delivery provider. Nothing is sent.' : 'Unavailable: LayeredFX Twilio SMS is not configured in this environment. Nothing is sent.'}</span>}</span>
        </label>
        {a.hasMessage && available && rule?.enabled && <textarea aria-label="Auto-reply message" className="mt-2" maxLength={1000} placeholder="Thanks for reaching out! I'll be in touch shortly." value={rule.message || ''} onChange={e => setRule(a.action, {message: e.target.value})}/>}
      </div>;
    })}
  </Group>;
}
