// Lead Finder: reads one public page and returns contact drafts for review. Nothing is saved here; the dashboard
// imports only the rows a team member selects, through the existing contact.import command.
import {OperationError} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import {checkOrigin, errorResponse} from '@/lib/operations/server';
import {scrapeActor} from '@/lib/scraper/access';
import {findLeads, grokReady} from '@/lib/scraper/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = {'Cache-Control': 'private, no-store', Vary: 'Cookie'};

export async function GET() {
  try {
    await scrapeActor();
    return Response.json({ai: grokReady()}, {headers});
  } catch (e) { return errorResponse(e); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const actor = await scrapeActor();
    let body: Record<string, unknown>;
    try { body = JSON.parse(await readBody(request, 20000)); } catch (e) { if (e instanceof OperationError) throw e; throw new OperationError('Invalid request.', 400); }
    const result = await findLeads(actor, {url: body.url, instructions: typeof body.instructions === 'string' ? body.instructions : '', ai: body.ai === true});
    return Response.json(result, {headers});
  } catch (e) { return errorResponse(e); }
}
