"use client";
// Presentational card body shared by the public page and the builder preview.
// Adapted from Channel Cast OS components/business-cards/card-preview.tsx.
import {ExternalLink, Mail, MessageSquare, Nfc, Phone} from 'lucide-react';
import {cn} from '@/lib/layeredfx/utils';
import type {PublicBusinessCard} from '@/lib/business-cards/model';
import type {BusinessCardLink, BusinessCardSection, SlideshowSlide, StepItem} from '@/lib/business-cards/types';

export type CardAction = 'call' | 'sms' | 'email' | 'map' | 'lead' | 'website' | 'video';

export function hexAlpha(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}

export function CardPreview({card, links, sections, onLink, onAction}: {
  card: PublicBusinessCard;
  links: BusinessCardLink[];
  sections: BusinessCardSection[];
  onLink?: (link: BusinessCardLink) => void;
  onAction?: (action: CardAction) => void;
}) {
  const bg = card.background_color || '#19202e';
  const accent = card.accent_color || '#d6ff41';
  const text = card.text_color || '#eef1f5';
  const surface = hexAlpha(text, 0.06);
  const border = hexAlpha(text, 0.14);
  const media = card.media_settings || {};
  const shapeClass = media.profile_shape === 'square' ? 'rounded-md' : media.profile_shape === 'rounded' ? 'rounded-2xl' : 'rounded-full';
  const outlineColor = media.profile_outline ? (media.profile_outline_color || accent) : border;
  const alignClass = media.content_align === 'left' ? 'items-start text-left' : 'items-center text-center';
  const useBgImage = Boolean(media.use_background_image && card.background_image_url);
  const name = card.display_name || [card.first_name, card.last_name].filter(Boolean).join(' ') || 'Your name';
  const subtitle = [card.job_title, card.company_name].filter(Boolean).join(' · ');
  const ordered = [...sections].filter(s => s.is_visible && s.section_type !== 'opener').sort((a, b) => a.display_order - b.display_order);
  const note = (title: string, body: string) => <div className="rounded-xl px-4 py-3 text-xs" style={{background: surface, border: `1px solid ${border}`, color: hexAlpha(text, 0.65)}}><div className="font-semibold" style={{color: text}}>{title}</div>{body}</div>;

  const pill = (label: string, icon: React.ReactNode, action: CardAction) => (
    <button key={label} type="button" onClick={() => onAction?.(action)} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-3 text-xs font-medium transition active:scale-95 motion-reduce:transition-none" style={{background: surface, border: `1px solid ${border}`, color: accent}}>
      {icon}<span>{label}</span>
    </button>
  );
  const linkRow = (label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] motion-reduce:transition-none" style={{background: surface, border: `1px solid ${border}`, color: text}}>
      <span>{label}</span><ExternalLink aria-hidden className="h-4 w-4 opacity-60"/>
    </button>
  );

  function renderSection(s: BusinessCardSection) {
    const wrap = (node: React.ReactNode) => node ? <div key={s.id} style={{marginTop: s.margin_top, marginBottom: s.margin_bottom}}>{node}</div> : null;
    switch (s.section_type) {
      case 'profile_header': {
        // eslint-disable-next-line @next/next/no-img-element
        const logo = card.logo_url ? <img src={card.logo_url} alt={`${card.company_name || name} logo`} className="object-contain" style={{height: media.logo_height || 24, width: media.logo_width || 'auto', maxWidth: '100%'}}/> : null;
        const photo = card.profile_photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={card.profile_photo_url} alt={name} className={cn('h-24 w-24 object-cover', shapeClass)} style={{border: `2px solid ${outlineColor}`}}/>
          : <div aria-hidden className={cn('grid h-24 w-24 place-items-center text-2xl font-semibold', shapeClass)} style={{background: surface, color: accent, border: `2px solid ${outlineColor}`}}>{name.slice(0, 1)}</div>;
        return wrap(<div className={cn('flex flex-col', alignClass)}>
          {logo ? <div className="mb-3">{media.logo_link_url ? <a href={media.logo_link_url} target="_blank" rel="noopener noreferrer" className="inline-block">{logo}</a> : logo}</div>
            : <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{color: hexAlpha(text, 0.55)}}>{card.company_name || 'Digital card'}</div>}
          {media.profile_link_url ? <a href={media.profile_link_url} target="_blank" rel="noopener noreferrer" className="inline-block">{photo}</a> : photo}
          <h1 className="mt-3 text-lg font-semibold" style={{color: text}}>{name}</h1>
          {subtitle && <div className="mt-0.5 text-xs font-medium" style={{color: hexAlpha(text, 0.72)}}>{subtitle}</div>}
          {card.bio && <p className="mt-2 whitespace-pre-line text-xs leading-5" style={{color: hexAlpha(text, 0.72)}}>{card.bio}</p>}
        </div>);
      }
      case 'quick_actions': {
        const actions = [
          card.primary_phone && pill('Call', <Phone aria-hidden className="h-4 w-4"/>, 'call'),
          (card.sms_phone || card.primary_phone) && pill('Text', <MessageSquare aria-hidden className="h-4 w-4"/>, 'sms'),
          card.primary_email && pill('Email', <Mail aria-hidden className="h-4 w-4"/>, 'email'),
        ].filter(Boolean);
        return wrap(actions.length ? <div className="flex gap-2">{actions}</div> : null);
      }
      case 'links': {
        const rows = [
          card.website_url && linkRow('Website', () => onAction?.('website'), 'website'),
          card.maps_url && linkRow('Directions', () => onAction?.('map'), 'map'),
          ...links.filter(l => l.is_visible).map(l => linkRow(l.label || 'Link', () => onLink?.(l), l.id)),
        ].filter(Boolean);
        return wrap(rows.length ? <div className="flex flex-col gap-2">{rows}</div> : null);
      }
      case 'lead_capture':
        return wrap(card.lead_form_settings?.enabled ? <button type="button" onClick={() => onAction?.('lead')} className="w-full rounded-xl py-3 text-sm font-semibold transition active:scale-[0.99] motion-reduce:transition-none" style={{background: accent, color: bg}}>{card.lead_form_settings.button_label || 'Send me your info'}</button> : null);
      case 'video':
        return wrap(card.intro_video_url ? linkRow('Watch intro video', () => onAction?.('video'), 'video') : note('Intro video', 'Add an intro video URL to show this section.'));
      case 'qr_code':
        return wrap(<div className="flex justify-center"><div className="rounded-xl bg-white p-3">
          {card.slug
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={`/api/cards/qr?slug=${encodeURIComponent(card.slug)}&source=qr&size=320&fg=${encodeURIComponent(card.qr_settings?.foreground || '#19202e')}`} alt="QR code for this card" className="h-36 w-36"/>
            : <div className="grid h-36 w-36 place-items-center text-center text-[11px] text-neutral-500">QR code appears after the card is saved</div>}
        </div></div>);
      case 'slideshow': {
        const slides = (Array.isArray(s.content?.slides) ? s.content.slides : []) as SlideshowSlide[];
        if (!slides.length) return wrap(note('Slideshow', 'Add images in the Slideshow panel to show a gallery here.'));
        return wrap(<div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: 'none'}} aria-label="Image gallery" tabIndex={0}>
          {slides.map(sl => <figure key={sl.id} className="relative m-0 w-full shrink-0 snap-center overflow-hidden rounded-xl" style={{border: `1px solid ${border}`}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sl.image_url} alt={sl.caption || ''} className="h-44 w-full object-cover"/>
            {sl.caption && <figcaption className="absolute inset-x-0 bottom-0 px-3 py-1.5 text-xs font-medium" style={{background: hexAlpha(bg, 0.72), color: text}}>{sl.caption}</figcaption>}
          </figure>)}
        </div>);
      }
      case 'steps': {
        const steps = (Array.isArray(s.content?.steps) ? s.content.steps : []) as StepItem[];
        if (!steps.length) return wrap(note('Steps', 'Add steps in the Steps panel to show a “how it works” list.'));
        return wrap(<ol className="m-0 flex list-none flex-col gap-2 p-0">
          {steps.map((st, i) => <li key={st.id} className="flex gap-3 rounded-xl px-3 py-2.5" style={{background: surface, border: `1px solid ${border}`}}>
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold" style={{background: accent, color: bg}}>{i + 1}</span>
            <div><div className="text-sm font-semibold" style={{color: text}}>{st.title}</div>{st.description && <div className="text-xs" style={{color: hexAlpha(text, 0.72)}}>{st.description}</div>}</div>
          </li>)}
        </ol>);
      }
      case 'nfc':
        return wrap(<div className="rounded-xl px-4 py-3 text-xs" style={{background: surface, border: `1px solid ${border}`, color: hexAlpha(text, 0.65)}}>
          <div className="flex items-center gap-1.5 font-semibold" style={{color: text}}><Nfc aria-hidden className="h-3.5 w-3.5"/>Tap to share</div>
          Tap a programmed LayeredFX NFC card or tag with a phone to open this page.
        </div>);
      default:
        return null;
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[26px] p-5" style={{background: bg, color: text, border: `1px solid ${border}`, ...(useBgImage ? {backgroundImage: `linear-gradient(${hexAlpha(bg, 0.82)}, ${hexAlpha(bg, 0.92)}), url("${encodeURI(card.background_image_url)}")`, backgroundSize: 'cover', backgroundPosition: 'center'} : {})}}>
      {ordered.map(renderSection)}
      <div className="mt-4 text-center text-[10px]" style={{color: hexAlpha(text, 0.45)}}>Digital card by LayeredFX</div>
    </div>
  );
}
