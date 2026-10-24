// Contact enrichment: reads a contact's own website (home page plus up to three contact/about/team pages) and
// returns proposed field values. Nothing is saved here; the dashboard applies only the fields a team member ticks,
// through the existing contact.save command.
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {scrapeActor} from '@/lib/scraper/access';
import {enrichSite} from '@/lib/scraper/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;
const headers = {'Cache-Control': 'private, no-store', Vary: 'Cookie'};
const text = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : '';

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const actor = await scrapeActor();
    let body: Record<string, unknown>;
    try { body = JSON.parse(await readBody(request, 20000)); } catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid request.', 400); }
    const contact = {name: text(body.name, 200), company: text(body.company, 200), website: text(body.website, 500), email: text(body.email, 254)};
    return Response.json(await enrichSite(actor, contact, body.ai === true), {headers});
  } catch (e) { return errorResponse(e); }
}
