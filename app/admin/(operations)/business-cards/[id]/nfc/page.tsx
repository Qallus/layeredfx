import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft} from 'lucide-react';
import {NfcPhoneWriter} from '@/components/business-cards/nfc-phone-writer';
import {PageTitle} from '@/components/operations/shared';
import {OperationError} from '@/lib/operations/engine.mjs';
import {cardName, publicCardUrl, requireCardAccess} from '@/lib/business-cards/model';
import {cardRepository} from '@/lib/business-cards/repository';
import {cardActor, siteUrl} from '@/lib/business-cards/server';

export const metadata = {title: 'Write NFC'};
export const dynamic = 'force-dynamic';

// Opened on a phone from the QR in the card list's NFC dialog, so a desktop user can
// finish programming items on a device that can write them. The protected layout
// has already verified the session; this checks the card belongs to the member.
export default async function CardNfcPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const actor = await cardActor();
  const card = await cardRepository().getCard(id);
  try { requireCardAccess(actor, card); }
  catch (e) { if (e instanceof OperationError && e.status === 404) notFound(); throw e; }
  return (
    <div className="mx-auto max-w-md">
      <Link href="/admin/business-cards" className="ops-back"><ArrowLeft aria-hidden size={14}/> Business cards</Link>
      <PageTitle title="Write to an NFC item" description={`Tap a card, sticker or key fob to program it with ${cardName(card)}'s card.`}/>
      <NfcPhoneWriter cardId={card.id} revision={card.revision} url={publicCardUrl(siteUrl(), card.slug, 'nfc')} published={card.status === 'published'} nfcActive={card.nfc_status === 'active'}/>
    </div>
  );
}
