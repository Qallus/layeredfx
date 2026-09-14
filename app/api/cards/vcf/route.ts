// Public vCard (.vcf) download for a published card.
import {isValidSlug, publicCard, publicCardUrl, vcard} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {siteUrl} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!isValidSlug(slug)) return new Response('A valid card is required.', {status: 400});
  try {
    const card = await cardRepository().getPublishedCard(slug);
    if (!card) return new Response('Card not found.', {status: 404});
    return new Response(vcard(publicCard(card), publicCardUrl(siteUrl(), card.slug)), {
      headers: {'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': `attachment; filename="${card.slug}.vcf"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'},
    });
  } catch {
    return new Response('The card is unavailable right now.', {status: 503});
  }
}
