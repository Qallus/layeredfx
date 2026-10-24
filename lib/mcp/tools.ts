import 'server-only';
// LayeredFX tools exposed to Claude over MCP. Reads use the member's visible state; every change is one engine
// command through applyAs, so permissions, stage rules, duplicate checks and audit history all apply. There is no
// tool that sends email, SMS or calls: customer-facing messages are drafted by Claude elsewhere (e.g. Gmail drafts).
import {blockingSteps, guideFor, needsNextStep, OperationError, stageDays, stats, STAGES} from '@/lib/operations/engine.mjs';
import {LABELS, LOST_REASONS} from '@/lib/operations/defaults.mjs';
import {matchingContacts} from '@/lib/operations/contacts.mjs';
import {jobLabel} from '@/lib/operations/jobs.mjs';
import {enrichmentChanges, enrichmentDetails, normalizeLead} from '@/lib/scraper/extract.mjs';
import {enrichSite, findLeads, grokReady} from '@/lib/scraper/service';
import {applyAs, loadState} from './state';
import type {Actor, Contact, Deal, OperationState, Stage} from '@/lib/operations/types';

type Args = Record<string, unknown>;
type Schema = {type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties?: boolean};
export type Tool = {
  name: string; title: string; description: string; inputSchema: Schema;
  /** read: any member; write: staff and admins; web: staff and admins, reads outside websites. */
  access: 'read' | 'write' | 'web';
  run: (actor: Actor, args: Args) => Promise<unknown>;
};

const fail = (message: string, status = 400): never => { throw new OperationError(message, status); };
const str = (args: Args, key: string, max = 500) => { const v = args[key]; if (v === undefined || v === null) return ''; if (typeof v !== 'string') fail(`${key} must be text.`); return (v as string).trim().slice(0, max); };
const need = (args: Args, key: string, max = 500) => str(args, key, max) || fail(`${key} is required.`);
const limit = (args: Args, fallback = 20, max = 50) => { const n = Number(args.limit ?? fallback); return Number.isFinite(n) ? Math.min(max, Math.max(1, Math.floor(n))) : fallback; };
const bool = (args: Args, key: string, fallback: boolean) => typeof args[key] === 'boolean' ? args[key] as boolean : fallback;
const S = (description: string, extra: Record<string, unknown> = {}) => ({type: 'string', description, ...extra});
const person = (s: OperationState, id?: string) => s.people.find(p => p.id === id)?.name || 'Unassigned';
const stageLabel = (s: OperationState, stage: string) => s.stageConfig?.[stage as Stage]?.label || LABELS[stage as Stage] || stage;

function contactSummary(s: OperationState, c: Contact) {
  return {id: c.id, name: c.name, company: c.company, title: c.title || '', email: c.email, phone: c.phone, website: c.website || '', city: c.city || '', state: c.state || '',
    category: c.type, status: c.status || 'active', owner: person(s, c.owner), tags: c.tags || [], source: c.source || '', lastContact: c.lastContact || ''};
}
function dealSummary(s: OperationState, d: Deal) {
  return {id: d.id, name: d.name, client: d.client, contactId: d.contactId, stage: d.stage, stageLabel: stageLabel(s, d.stage), value: d.value, probability: d.probability,
    owner: person(s, d.owner), daysInStage: stageDays(d), nextStep: d.nextStep ? {action: d.nextStep.action, dueDate: d.nextStep.dueDate, type: d.nextStep.type} : null,
    needsNextStep: needsNextStep(d), stalled: d.stalled?.reason || null, closeDate: d.closeDate || '', archived: !!d.archivedAt};
}
const openDeals = (s: OperationState) => s.deals.filter(d => !d.archivedAt && !['closed_won', 'closed_lost'].includes(d.stage));
const contactById = (s: OperationState, id: string) => s.contacts.find(c => c.id === id) || fail('Contact not found.', 404);
const dealById = (s: OperationState, id: string) => s.deals.find(d => d.id === id) || fail('Opportunity not found.', 404);

const ACTIVITY_KINDS = ['note', 'call', 'sms', 'email', 'meeting'];
const DEAL_ACTIVITY_KINDS = ['note', 'call', 'email', 'sms', 'meeting', 'task'];
const CONTACT_FIELDS = ['name', 'company', 'title', 'email', 'phone', 'website', 'address', 'city', 'state', 'zip', 'source', 'notes'] as const;
const LEAD_PROPS = Object.fromEntries(['name', 'company', 'title', 'email', 'phone', 'website', 'address', 'city', 'state', 'zip', 'notes', 'sourceUrl'].map(k => [k, {type: 'string'}]));

export const TOOLS: Tool[] = [
  {name: 'get_overview', title: 'Business overview', access: 'read',
    description: 'Snapshot of LayeredFX: contact and lead counts, open pipeline by stage with value, opportunities that need a next step or are stalled, and active installation jobs by stage. Start here.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
    async run(actor) {
      const s = await loadState(actor);
      const active = s.contacts.filter(c => c.status !== 'archived'), open = openDeals(s);
      const byStage = STAGES.map(stage => { const ds = open.filter(d => d.stage === stage); return {stage, label: stageLabel(s, stage), count: ds.length, value: ds.reduce((t, d) => t + (d.value || 0), 0)}; }).filter(x => x.count);
      const jobs = (s.jobs || []).filter(j => !(j as {archivedAt?: string}).archivedAt);
      return {
        contacts: {total: active.length, leads: active.filter(c => c.type === 'lead').length, prospects: active.filter(c => c.type === 'prospect').length, customers: active.filter(c => c.type === 'client').length},
        leads: {new: s.leads.filter(l => l.status === 'new').length, total: s.leads.length},
        pipeline: {...stats(s.deals.filter(d => !d.archivedAt)), byStage},
        needsAttention: open.filter(d => needsNextStep(d) || d.stalled).slice(0, 15).map(d => dealSummary(s, d)),
        jobs: [...new Set(jobs.map(j => j.stage))].map(stage => ({stage, label: jobLabel(s, stage), count: jobs.filter(j => j.stage === stage).length})),
        aiExtractionAvailable: grokReady(),
      };
    }},
  {name: 'search_contacts', title: 'Search contacts', access: 'read',
    description: 'Find contacts, leads, potential customers and customers by name, company, email, phone or city.',
    inputSchema: {type: 'object', properties: {query: S('Text to match; empty lists the most recent.'), category: S('Filter by category.', {enum: ['contact', 'lead', 'prospect', 'client']}), status: S('Default active.', {enum: ['active', 'inactive', 'archived', 'any']}), tag: S('Only contacts with this tag.'), limit: {type: 'integer', minimum: 1, maximum: 50}}, additionalProperties: false},
    async run(actor, args) {
      const s = await loadState(actor), q = str(args, 'query', 200).toLowerCase(), category = str(args, 'category'), status = str(args, 'status') || 'active', tag = str(args, 'tag', 50);
      const rows = s.contacts.filter(c => (!category || c.type === category) && (status === 'any' || (c.status || 'active') === status) && (!tag || c.tags?.includes(tag))
        && (!q || [c.name, c.company, c.email, c.phone, c.city].join(' ').toLowerCase().includes(q)));
      return {count: rows.length, contacts: rows.slice().reverse().slice(0, limit(args)).map(c => contactSummary(s, c))};
    }},
  {name: 'get_contact', title: 'Contact details', access: 'read',
    description: 'One contact with its full details, website findings, recent activity, leads and opportunities.',
    inputSchema: {type: 'object', properties: {id: S('Contact id from search_contacts.')}, required: ['id'], additionalProperties: false},
    async run(actor, args) {
      const s = await loadState(actor), c = contactById(s, need(args, 'id', 100));
      return {...contactSummary(s, c), address: c.address || '', zip: c.zip || '', notes: c.notes || '', details: c.details || {},
        activity: (s.contactActivities || []).filter(a => a.contactId === c.id).slice(-20).reverse().map(a => ({kind: a.kind, body: a.body, at: a.occurredAt, by: person(s, a.actorId)})),
        leads: s.leads.filter(l => l.contactId === c.id).map(l => ({id: l.id, status: l.status, source: l.source, opportunityId: l.opportunityId})),
        opportunities: s.deals.filter(d => d.contactId === c.id).map(d => dealSummary(s, d))};
    }},
  {name: 'list_opportunities', title: 'List pipeline opportunities', access: 'read',
    description: 'Pipeline opportunities with stage, value, owner and next step. Use attention=true for ones missing a current next step or flagged stalled.',
    inputSchema: {type: 'object', properties: {stage: S('Only this stage.', {enum: STAGES}), attention: {type: 'boolean', description: 'Only opportunities that need a next step or are stalled.'}, includeClosed: {type: 'boolean'}, limit: {type: 'integer', minimum: 1, maximum: 50}}, additionalProperties: false},
    async run(actor, args) {
      const s = await loadState(actor), stage = str(args, 'stage');
      const rows = (bool(args, 'includeClosed', false) ? s.deals.filter(d => !d.archivedAt) : openDeals(s)).filter(d => (!stage || d.stage === stage) && (!args.attention || needsNextStep(d) || d.stalled));
      return {count: rows.length, opportunities: rows.slice(0, limit(args)).map(d => dealSummary(s, d))};
    }},
  {name: 'get_opportunity', title: 'Opportunity details', access: 'read',
    description: 'One opportunity: stage goal, required steps still blocking the next stage, recent activity and stage history.',
    inputSchema: {type: 'object', properties: {id: S('Opportunity id.')}, required: ['id'], additionalProperties: false},
    async run(actor, args) {
      const s = await loadState(actor), d = dealById(s, need(args, 'id', 100)), guide = guideFor(s, d);
      return {...dealSummary(s, d), opportunityType: d.opportunityType, source: d.source, stageGoal: guide.goal, suggestedActions: guide.actions,
        blockingSteps: blockingSteps(s, d).map(i => i.label), contact: s.contacts.find(c => c.id === d.contactId) ? contactSummary(s, contactById(s, d.contactId)) : null,
        activity: s.activities.filter(a => a.dealId === d.id).slice(-20).reverse().map(a => ({kind: a.kind, body: a.body, at: a.occurredAt, by: a.actor})),
        stageHistory: d.stageHistory.slice(-10).map(h => ({stage: h.stage, at: h.at, by: person(s, h.by)}))};
    }},
  {name: 'list_pipeline_stages', title: 'Pipeline stages and rules', access: 'read',
    description: 'The sales stages in order, each with its goal and the required steps that must be done before moving past it.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
    async run(actor) {
      const s = await loadState(actor);
      return {lostReasons: LOST_REASONS, stages: STAGES.map(stage => { const g = s.stageConfig?.[stage] || guideFor(s, {stage, extraItems: []} as unknown as Deal, stage); return {stage, label: stageLabel(s, stage), goal: g.goal, requiredSteps: g.items.filter(i => i.required).map(i => i.label)}; }),
        rules: 'Moving forward requires each passed stage\'s required steps. closed_lost needs lostReason; closed_won needs a positive value and wonSummary; nurture needs a current next step; reopening a closed opportunity needs reason.'};
    }},
  {name: 'list_jobs', title: 'Installation jobs', access: 'read',
    description: 'Installation jobs with stage, address, services, dates and next step.',
    inputSchema: {type: 'object', properties: {stage: S('Only this job stage key.'), limit: {type: 'integer', minimum: 1, maximum: 50}}, additionalProperties: false},
    async run(actor, args) {
      const s = await loadState(actor), stage = str(args, 'stage');
      const jobs = (s.jobs || []).filter(j => !(j as {archivedAt?: string}).archivedAt && (!stage || j.stage === stage));
      return {count: jobs.length, jobs: jobs.slice(0, limit(args)).map(j => ({id: j.id, number: j.number, name: j.name, stage: j.stage, stageLabel: jobLabel(s, j.stage), address: j.address, services: j.services, value: j.value, startDate: j.startDate, targetDate: j.targetDate, owner: person(s, j.owner), contactId: j.contactId, opportunityId: j.opportunityId, nextStep: j.nextStep}))};
    }},

  {name: 'save_contact', title: 'Create or update a contact', access: 'write',
    description: 'Create a contact (omit id) or update fields on one (with id). Only the fields you pass change. Creating with an email or phone that already exists returns the existing contact instead of a duplicate.',
    inputSchema: {type: 'object', properties: {id: S('Contact id to update; omit to create.'), ...Object.fromEntries(CONTACT_FIELDS.map(k => [k, {type: 'string'}])), category: S('Category.', {enum: ['contact', 'lead', 'prospect', 'client']}), status: S('Status.', {enum: ['active', 'inactive', 'archived']}), tags: {type: 'array', items: {type: 'string'}, maxItems: 20}}, additionalProperties: false},
    async run(actor, args) {
      const patch: Record<string, unknown> = {};
      for (const k of CONTACT_FIELDS) if (typeof args[k] === 'string') patch[k] = (args[k] as string).trim();
      if (args.category) patch.type = str(args, 'category');
      if (args.status) patch.status = str(args, 'status');
      if (Array.isArray(args.tags)) patch.tags = args.tags.filter(t => typeof t === 'string');
      const id = str(args, 'id', 100);
      if (!id && !patch.name) fail('name is required to create a contact.');
      if (!id) patch.source ||= 'Claude';
      const {state, resultId} = await applyAs(actor, {type: 'contact.save', id: id || undefined, patch});
      return {saved: contactSummary(state, contactById(state, resultId || id))};
    }},
  {name: 'log_contact_activity', title: 'Log contact activity', access: 'write',
    description: 'Record a note, call, SMS, email or meeting on a contact\'s timeline. This only records history; it does not send anything.',
    inputSchema: {type: 'object', properties: {contactId: S('Contact id.'), kind: S('Activity type.', {enum: ACTIVITY_KINDS}), body: S('What happened (up to 5,000 characters).')}, required: ['contactId', 'kind', 'body'], additionalProperties: false},
    async run(actor, args) {
      await applyAs(actor, {type: 'contact.activity', id: need(args, 'contactId', 100), kind: need(args, 'kind'), body: need(args, 'body', 5000)});
      return {logged: true};
    }},
  {name: 'add_to_pipeline', title: 'Add contact to pipeline', access: 'write',
    description: 'Open a sales opportunity for a contact, starting at New / Working. If the contact already has one, its id is returned instead.',
    inputSchema: {type: 'object', properties: {contactId: S('Contact id.'), name: S('Opportunity name; defaults to the contact name.'), value: {type: 'number', minimum: 0, description: 'Estimated value in USD.'}, opportunityType: S('Type.', {enum: ['Residential', 'Commercial']})}, required: ['contactId'], additionalProperties: false},
    async run(actor, args) {
      const {state, resultId} = await applyAs(actor, {type: 'contact.pipeline', id: need(args, 'contactId', 100), name: str(args, 'name', 200) || undefined, value: typeof args.value === 'number' ? args.value : undefined, opportunityType: str(args, 'opportunityType') || undefined});
      return {opportunity: dealSummary(state, dealById(state, resultId || ''))};
    }},
  {name: 'move_opportunity_stage', title: 'Move opportunity stage', access: 'write',
    description: 'Move an opportunity to another stage. LayeredFX enforces the stage rules (see list_pipeline_stages); if required steps are incomplete the move is refused with the list of what is missing.',
    inputSchema: {type: 'object', properties: {id: S('Opportunity id.'), stage: S('Target stage.', {enum: STAGES}), reason: S('Required when reopening a closed opportunity.'), lostReason: S('Required for closed_lost.', {enum: LOST_REASONS}), wonSummary: S('Required for closed_won.')}, required: ['id', 'stage'], additionalProperties: false},
    async run(actor, args) {
      const {state} = await applyAs(actor, {type: 'deal.stage', id: need(args, 'id', 100), stage: need(args, 'stage'), reason: str(args, 'reason', 2000), lostReason: str(args, 'lostReason'), wonSummary: str(args, 'wonSummary', 2000)});
      return {opportunity: dealSummary(state, dealById(state, str(args, 'id', 100)))};
    }},
  {name: 'set_next_step', title: 'Set opportunity next step', access: 'write',
    description: 'Set the next action and due date on an opportunity (every open opportunity should have one).',
    inputSchema: {type: 'object', properties: {id: S('Opportunity id.'), action: S('What to do next.'), dueDate: S('YYYY-MM-DD.'), dueTime: S('HH:MM, optional.'), stepType: S('Type.', {enum: ['call', 'email', 'sms', 'meeting', 'demo', 'proposal', 'follow_up', 'contract', 'other']}), priority: S('Priority.', {enum: ['low', 'normal', 'high']}), assigneeId: S('Team member id; defaults to the owner.')}, required: ['id', 'action', 'dueDate'], additionalProperties: false},
    async run(actor, args) {
      const id = need(args, 'id', 100);
      const {state} = await applyAs(actor, {type: 'deal.next', id, action: need(args, 'action', 500), dueDate: need(args, 'dueDate', 10), dueTime: str(args, 'dueTime', 5) || undefined, stepType: str(args, 'stepType') || undefined, priority: str(args, 'priority') || undefined, assignee: str(args, 'assigneeId', 100) || undefined});
      return {opportunity: dealSummary(state, dealById(state, id))};
    }},
  {name: 'log_opportunity_activity', title: 'Log opportunity activity', access: 'write',
    description: 'Record a note, call, email, SMS, meeting or task on an opportunity\'s history. Records only; nothing is sent.',
    inputSchema: {type: 'object', properties: {id: S('Opportunity id.'), kind: S('Activity type.', {enum: DEAL_ACTIVITY_KINDS}), body: S('What happened.')}, required: ['id', 'kind', 'body'], additionalProperties: false},
    async run(actor, args) {
      await applyAs(actor, {type: 'deal.activity', id: need(args, 'id', 100), kind: need(args, 'kind'), body: need(args, 'body', 12000)});
      return {logged: true};
    }},

  {name: 'find_leads', title: 'Find leads on a web page', access: 'web',
    description: 'Read one public web page (a directory, association member list, search results page…) and return the businesses or people listed with their contact details. Nothing is saved; review the list, then call import_leads. Sites that disallow automated tools in robots.txt are skipped.',
    inputSchema: {type: 'object', properties: {url: S('Full https address of the page.'), instructions: S('What to extract, e.g. "interior designers in Scottsdale with phone and website".'), useAi: {type: 'boolean', description: 'AI extraction (Grok). Defaults to on when available; off finds only structured business data and email/phone links.'}}, required: ['url'], additionalProperties: false},
    async run(actor, args) {
      return findLeads(actor, {url: need(args, 'url', 2000), instructions: str(args, 'instructions', 1000), ai: bool(args, 'useAi', grokReady())});
    }},
  {name: 'import_leads', title: 'Import leads', access: 'write',
    description: 'Save businesses or people as LayeredFX contacts (default category lead, which also creates Lead records). Anyone whose email or phone already exists is skipped and reported, not duplicated.',
    inputSchema: {type: 'object', properties: {leads: {type: 'array', minItems: 1, maxItems: 200, items: {type: 'object', properties: LEAD_PROPS, additionalProperties: false}}, category: S('Default lead.', {enum: ['lead', 'prospect', 'contact']}), tags: {type: 'array', items: {type: 'string'}, maxItems: 20}}, required: ['leads'], additionalProperties: false},
    async run(actor, args) {
      const raw = Array.isArray(args.leads) ? args.leads.slice(0, 200) : fail('leads must be a list.');
      const type = str(args, 'category') || 'lead', tags = Array.isArray(args.tags) ? args.tags.filter(t => typeof t === 'string').slice(0, 20) : ['claude'];
      const s = await loadState(actor), fresh: Contact[] = [], skipped: {name: string; reason: string; existingId?: string}[] = [], rows: {draft: Record<string, unknown>}[] = [];
      for (const item of raw as Args[]) {
        const sourceUrl = typeof item.sourceUrl === 'string' ? item.sourceUrl : '';
        const lead = normalizeLead(item, sourceUrl);
        if (!sourceUrl) lead.source = 'Claude';
        if (!lead.name) { skipped.push({name: '(no name)', reason: 'No name, email or phone.'}); continue; }
        const existing = matchingContacts(s.contacts, lead);
        if (existing.length) { skipped.push({name: lead.name, reason: existing.length > 1 ? 'Matches more than one existing contact.' : 'Already a contact.', existingId: existing[0].id}); continue; }
        if (matchingContacts(fresh, lead).length) { skipped.push({name: lead.name, reason: 'Duplicate within this list.'}); continue; }
        fresh.push({...lead, id: `new-${fresh.length}`, type} as Contact);
        rows.push({draft: {...lead, details: sourceUrl ? lead.details : {}, type, owner: actor.id, tags}});
      }
      if (rows.length) await applyAs(actor, {type: 'contact.import', rows});
      return {imported: rows.length, importedNames: fresh.map(c => c.name), skipped};
    }},
  {name: 'enrich_contact', title: 'Enrich a contact from its website', access: 'web',
    description: 'Read the contact\'s own website (or its business email domain) plus up to three contact/about/team pages and propose missing details: company, job title, email, phone, website, address, description, social profiles, people on the site. With apply "fill_blanks" it saves only fields that are currently empty, plus the findings, and logs it; to replace an existing value, call save_contact explicitly.',
    inputSchema: {type: 'object', properties: {id: S('Contact id.'), apply: S('Default none (propose only).', {enum: ['none', 'fill_blanks']}), useAi: {type: 'boolean', description: 'Defaults to on when available.'}}, required: ['id'], additionalProperties: false},
    async run(actor, args) {
      const s = await loadState(actor), c = contactById(s, need(args, 'id', 100));
      if (c.status === 'archived') fail('Restore the contact before enriching it.');
      const found = await enrichSite(actor, c, bool(args, 'useAi', grokReady()));
      const changes = enrichmentChanges(c as unknown as Record<string, unknown>, found.profile);
      if (str(args, 'apply') !== 'fill_blanks') return {...found, proposedChanges: changes, applied: false};
      const fill = changes.filter(x => x.fill);
      // contact.save replaces details, so existing entries are kept; the contact limit is 60 entries.
      const details = Object.fromEntries(Object.entries({...(c.details || {}), ...enrichmentDetails(found.profile, found.pages, new Date().toISOString())}).slice(-60));
      await applyAs(actor, {type: 'contact.save', id: c.id, patch: {...Object.fromEntries(fill.map(x => [x.key, x.found])), details}});
      await applyAs(actor, {type: 'contact.activity', id: c.id, kind: 'note', body: `Enriched by Claude from ${found.site}${fill.length ? `: filled ${fill.map(x => x.key).join(', ')}` : ''}. Website findings saved to details.`});
      return {...found, proposedChanges: changes, applied: true, filled: fill.map(x => x.key), notReplaced: changes.filter(x => !x.fill).map(x => ({field: x.key, current: x.current, found: x.found}))};
    }},
];

export const toolsFor = (actor: Actor) => TOOLS.filter(t => t.access === 'read' || actor.role !== 'viewer');
