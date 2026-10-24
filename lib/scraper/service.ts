import 'server-only';
// Lead Finder and enrichment, shared by the dashboard routes and the MCP tools. Nothing here saves to LayeredFX.
import {OperationError} from '@/lib/operations/engine.mjs';
import {agentFailure, grokChat, grokReady} from '@/lib/agents/client';
import {fetchPage, type FetchedPage} from './fetch';
import {scrapeThrottle} from './access';
import {builtInLeads, builtInProfile, ENRICH_SYSTEM, enrichPrompt, LEAD_SYSTEM, leadPrompt, parseAiLeads, parseAiProfile, relatedLinks, websiteFor, type EnrichProfile, type LeadDraft} from './extract.mjs';
import type {Actor} from '@/lib/operations/types';

export {grokReady};
function needAi(useAi: boolean, what: string) {
  if (useAi && !grokReady()) throw new OperationError(`AI ${what} needs Grok. Add LFX_XAI_API_KEY to the LayeredFX environment, or turn AI off.`, 503);
}

export async function findLeads(actor: Actor, input: {url: unknown; instructions?: string; ai: boolean}): Promise<{url: string; title: string; method: 'ai' | 'built-in'; leads: LeadDraft[]}> {
  needAi(input.ai, 'extraction');
  scrapeThrottle(actor);
  const page = await fetchPage(input.url);
  if (!input.ai) return {url: page.url, title: page.title, method: 'built-in', leads: builtInLeads(page.html, page.url)};
  let reply;
  try { reply = await grokChat({system: LEAD_SYSTEM, prompt: leadPrompt((input.instructions || '').slice(0, 1000), page), limit: 60000, timeout: 45000}); } catch (e) { throw agentFailure(e); }
  try { return {url: page.url, title: page.title, method: 'ai', leads: parseAiLeads(reply.text, page.url)}; } catch (e) { throw new OperationError(e instanceof Error ? e.message : 'The AI reply could not be read.', 502); }
}

export async function enrichSite(actor: Actor, contact: {name?: string; company?: string; website?: string; email?: string}, useAi: boolean): Promise<{site: string; pages: string[]; method: 'ai' | 'built-in'; profile: EnrichProfile}> {
  needAi(useAi, 'enrichment');
  const site = websiteFor(contact);
  if (!site) throw new OperationError('No website to read. Add the company website, or a business email address, first.', 422);
  scrapeThrottle(actor);
  const home = await fetchPage(site);
  const pages: FetchedPage[] = [home];
  const related = relatedLinks(home.html, home.url);
  scrapeThrottle(actor, related.length);
  // A related page that cannot be read (robots.txt, 404) does not stop enrichment from the pages that could.
  for (const url of related) await fetchPage(url).then(page => { pages.push(page); }, () => {});
  let profile: EnrichProfile;
  if (useAi) {
    let reply;
    try { reply = await grokChat({system: ENRICH_SYSTEM, prompt: enrichPrompt(contact, pages), limit: 20000, timeout: 45000}); } catch (e) { throw agentFailure(e); }
    try { profile = parseAiProfile(reply.text, home.url); } catch (e) { throw new OperationError(e instanceof Error ? e.message : 'The AI reply could not be read.', 502); }
  } else {
    profile = builtInProfile(pages, home.url);
  }
  // The address actually read, after redirects, is the confirmed website.
  profile.website = profile.website || home.url;
  return {site: home.url, pages: pages.map(page => page.url), method: useAi ? 'ai' : 'built-in', profile};
}
