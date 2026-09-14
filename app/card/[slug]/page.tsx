import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {deviceFromUA, isValidSlug, publicCard, publicCardUrl} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {siteUrl} from '@/lib/business-cards/server';
import {PublicCard} from './public-card';

export const dynamic = 'force-dynamic';
type Props = {params: Promise<{slug: string}>; searchParams: Promise<{source?: string}>};

async function load(slug: string) {
  if (!isValidSlug(slug)) return null;
  // Storage failures surface as an error page; there is no fallback card.
  return cardRepository().getPublishedCard(slug);
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const card = await load((await params).slug).catch(() => null);
  if (!card) return {title: 'Card not found', robots: {index: false}};
  const name = card.display_name || [card.first_name, card.last_name].filter(Boolean).join(' ') || 'Digital business card';
  return {title: `${name} — Digital business card`, description: card.bio || [name, card.company_name].filter(Boolean).join(' · '), alternates: {canonical: publicCardUrl(siteUrl(), card.slug)}};
}

export default async function PublicCardPage({params, searchParams}: Props) {
  const [{slug}, {source}] = await Promise.all([params, searchParams]);
  const card = await load(slug);
  if (!card) notFound();
  const h = await headers();
  if (!h.get('next-router-prefetch') && h.get('purpose') !== 'prefetch') {
    const eventType = source === 'qr' ? 'qr_scan' : source === 'nfc' ? 'nfc_tap' : 'view';
    await cardRepository().recordEvent({card_id: card.id, event_type: eventType, link_id: null, source: source === 'qr' || source === 'nfc' ? source : 'organic', device_type: deviceFromUA(h.get('user-agent') || '')}).catch(() => {});
  }
  return <PublicCard card={publicCard(card)} publicUrl={publicCardUrl(siteUrl(), card.slug)}/>;
}
