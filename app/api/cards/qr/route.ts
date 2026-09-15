// QR PNG for a LayeredFX card URL. Unlike the Channel Cast route this is not an open
// QR generator: it only encodes public card URLs or the dashboard NFC write page.
import QRCode from 'qrcode';
import {isValidSlug} from '@/lib/business-cards/model';
import {siteUrl} from '@/lib/business-cards/server';

export const dynamic = 'force-dynamic';
const hex = (v: string | null, fallback: string) => v && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get('slug');
  const card = params.get('card');
  const source = params.get('source');
  let target: string;
  if (slug && isValidSlug(slug)) target = `${siteUrl()}/card/${slug}${source === 'qr' || source === 'nfc' ? `?source=${source}` : ''}`;
  else if (card && /^[A-Za-z0-9-]{1,64}$/.test(card)) target = `${siteUrl()}/admin/business-cards/${card}/nfc`;
  else return new Response('A valid card is required.', {status: 400});
  const size = Math.min(Math.max(Number(params.get('size')) || 512, 64), 1024);
  try {
    const png = await QRCode.toBuffer(target, {type: 'png', width: size, margin: 1, errorCorrectionLevel: 'M', color: {dark: hex(params.get('fg'), '#19202e'), light: hex(params.get('bg'), '#ffffff')}});
    const headers: Record<string, string> = {'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff'};
    if (params.get('download') === '1') headers['Content-Disposition'] = `attachment; filename="${slug || 'card'}-qr.png"`;
    return new Response(new Uint8Array(png), {headers});
  } catch {
    return new Response('Could not generate the QR code.', {status: 500});
  }
}
