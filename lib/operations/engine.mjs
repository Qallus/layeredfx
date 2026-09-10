import { DEFAULT_STAGES, PATH, STAGES, OPEN, TASK_STATUS, PRIORITIES, PLAN_TEMPLATES, DOC_TEMPLATES } from './defaults.mjs';
export { PATH, STAGES, OPEN, DEFAULT_STAGES } from './defaults.mjs';
export class OperationError extends Error {
    constructor(message, status = 400) { super(message); this.name = 'OperationError'; this.status = status; }
}
const fail = (message, status = 400) => { throw new OperationError(message, status); };
const clone = x => structuredClone(x);
const text = (v, max = 1000) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const need = (v, label, max = 200) => { const t = text(v, max); if (!t)
    fail(`${label} is required.`); return t; };
const num = (v, min = 0, max = 1e10) => { const n = Number(v); if (!Number.isFinite(n) || n < min || n > max)
    fail(`Number must be between ${min} and ${max}.`); return n; };
const oneOf = (v, options, label) => options.includes(v) ? v : fail(`Invalid ${label}.`);
export const uid = (prefix = 'r') => `${prefix}_${globalThis.crypto.randomUUID()}`;
export const today = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export function validDate(v, required = false) { if (!v && !required)
    return ''; const d = text(v, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(`${d}T12:00:00Z`)) || new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10) !== d)
    fail('Use a valid calendar date.'); return d; }
export function offsetDate(date, offset) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); }
export function emptyState() { return { schemaVersion: 2, revision: 0, updatedAt: null, people: [], contacts: [], leads: [], deals: [], stageConfig: {}, activities: [], workspaces: [{ id: 'ws_default', name: 'LayeredFX team' }], folders: [], documents: [], comments: [], plans: [], tasks: [], projects: [] }; }
export function access(record, actor, kind = 'document') {
    if (!record || !actor)
        return { view: false, edit: false, manage: false };
    const role = (kind === 'plan' ? record.members : record.collaborators)?.find(m => (m.user_id || m.id) === actor.id)?.[kind === 'plan' ? 'role' : 'permission'];
    const owner = record.owner_id === actor.id;
    const team = kind === 'plan' ? record.visibility === 'team' : record.scope === 'shared';
    const admin = actor.role === 'admin';
    const view = admin || owner || Boolean(role) || team;
    const manage = admin || (actor.role !== 'viewer' && (owner || role === 'owner'));
    const edit = view && actor.role !== 'viewer' && !record.archived_at && !record.deleted_at && (admin || owner || role === 'editor' || role === 'member' || (team && role !== 'viewer'));
    return { view, edit, manage };
}
export function visibleState(state, actor) {
    const out = clone(state);
    out.documents = out.documents.filter(d => access(d, actor).view);
    const ids = new Set(out.documents.map(d => d.id));
    out.comments = out.comments.filter(c => ids.has(c.document_id));
    out.plans = out.plans.filter(p => access(p, actor, 'plan').view);
    const ps = new Set(out.plans.map(p => p.id));
    out.tasks = out.tasks.filter(t => ps.has(t.plan_id));
    out.folders = out.folders.filter(f => actor.role === 'admin' || f.scope === 'shared' || f.owner_id === actor.id);
    return out;
}
const person = (s, id) => s.people.find(p => p.id === id) || fail('Choose an active team member.');
const entity = (s, key, id) => s[key].find(x => x.id === id) || fail('Record not found.', 404);
function recordAccess(s, key, id, actor, level = 'edit') { const r = entity(s, key, id); if (!access(r, actor, key === 'plans' ? 'plan' : 'document')[level])
    fail('You do not have permission for this record.', 403); return r; }
export function guideFor(state, deal, stage = deal.stage) { const g = state.stageConfig[stage] || DEFAULT_STAGES[stage]; return { ...clone(g), items: [...clone(g.items), ...(deal.extraItems || []).filter(i => i.stage === stage)] }; }
function automatic(s, d, key) { return { owner: !!d.owner, contact: !!s.contacts.find(c => c.id === d.contactId), source: !!d.source, next: !!d.nextStep?.action && !!d.nextStep?.dueDate, type: !!d.opportunityType, value: d.value > 0, close: !!d.closeDate, products: !!d.products?.length, closed: !!d.closedAt, summary: !!d.wonSummary, lost: !!d.lostReason, client: s.contacts.find(c => c.id === d.contactId)?.type === 'client' }[key] || false; }
export function stepsFor(s, d, stage = d.stage) { return guideFor(s, d, stage).items.map(i => ({ ...i, automatic: !!i.auto, done: i.auto ? automatic(s, d, i.auto) : Boolean(d.checklist?.[`${stage}:${i.id}`]) })); }
export const blockingSteps = (s, d, stage = d.stage) => stepsFor(s, d, stage).filter(i => i.required && !i.done);
export function needsNextStep(d, date = today()) { return !['closed_won', 'closed_lost'].includes(d.stage) && (!d.nextStep?.dueDate || d.nextStep.dueDate < date); }
export function stageDays(d, now = new Date()) { return Math.max(0, Math.floor((+now - Date.parse(d.stageEnteredAt || d.createdAt)) / 86400000)); }
export function stats(deals) { const all = deals.filter(d => !d.archivedAt); const open = all.filter(d => OPEN.includes(d.stage)); const won = all.filter(d => d.stage === 'closed_won'); const lost = all.filter(d => d.stage === 'closed_lost'); return { openCount: open.length, openValue: open.reduce((v, d) => v + d.value, 0), weighted: open.reduce((v, d) => v + d.value * d.probability / 100, 0), wonValue: won.reduce((v, d) => v + d.value, 0), winRate: won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) : 0 }; }
const audit = (s, d, actor, now, kind, body) => s.activities.push({ id: uid('act'), dealId: d.id, kind, body, actor: actor.name, actorId: actor.id, occurredAt: now });
function ownerChange(s, d, id, actor, now) { if (person(s, id).role === 'viewer')
    fail('Choose an owner who can work opportunities.'); if (d.owner !== id) {
    d.owner = id;
    d.ownerHistory.push({ owner: id, at: now, by: actor.id });
    audit(s, d, actor, now, 'owner', 'Opportunity owner reassigned.');
} }
function transition(s, d, to, c, actor, now) {
    oneOf(to, STAGES, 'stage');
    if (d.stage === to)
        return;
    if (d.archivedAt)
        fail('Restore this opportunity before editing.');
    const from = d.stage, closed = ['closed_won', 'closed_lost'].includes(from);
    if (closed && !text(c.reason))
        fail('A reopen reason is required.');
    if (to === 'closed_lost' && !text(c.lostReason))
        fail('Choose a lost reason.');
    if (to === 'nurture' && (!d.nextStep?.action || !d.nextStep?.dueDate || d.nextStep.dueDate < today(new Date(now))))
        fail('Nurture needs a current or future revisit action and date.');
    if (to === 'closed_won' && (!d.value || !text(c.wonSummary)))
        fail('A positive final value and won summary are required.');
    const forward = !closed && PATH.includes(to) && (PATH.indexOf(to) > PATH.indexOf(from) || from === 'nurture');
    const lastWorkingStage = from === 'nurture' ? [...d.stageHistory].reverse().find(e => OPEN.includes(e.stage))?.stage : from;
    const startIndex = Math.max(0, PATH.indexOf(lastWorkingStage || 'new_working'));
    const stages = from === 'nurture' ? ['nurture', ...PATH.slice(startIndex, PATH.indexOf(to))] : PATH.slice(startIndex, PATH.indexOf(to));
    const blockers = forward ? stages.flatMap(stage => blockingSteps(s, d, stage).map(i => `${DEFAULT_STAGES[stage].label}: ${i.label}`)) : [];
    if (blockers.length && !(actor.role === 'admin' && text(c.overrideReason)))
        fail(`Complete required steps before advancing: ${blockers.join('; ')}`);
    d.stage = to;
    d.probability = (s.stageConfig[to] || DEFAULT_STAGES[to]).probability;
    d.stageEnteredAt = now;
    const event = { stage: to, from, at: now, by: actor.id, note: text(c.reason || c.wonSummary || c.lostReason), overrideReason: text(c.overrideReason) };
    d.stageHistory.push(event);
    if (closed) {
        d.reopenedAt = now;
        d.closedAt = null;
    }
    if (to === 'closed_lost') {
        d.closedAt = now;
        d.lostReason = need(c.lostReason, 'Lost reason');
        d.lostNotes = text(c.lostNotes, 10000);
        d.competitor = text(c.competitor);
    }
    if (to === 'closed_won') {
        d.closedAt = now;
        d.wonSummary = need(c.wonSummary, 'Won summary', 5000);
        d.stalled = null;
        const contact = s.contacts.find(x => x.id === d.contactId);
        if (contact)
            contact.type = 'client';
        if (!s.projects.some(p => p.opportunityId === d.id))
            s.projects.push({ id: uid('project'), opportunityId: d.id, name: d.name, contactId: d.contactId, owner: d.owner, status: 'planning', createdAt: now });
    }
    audit(s, d, actor, now, 'stage', `${DEFAULT_STAGES[from].label} → ${DEFAULT_STAGES[to].label}${event.overrideReason ? ` · Admin override: ${event.overrideReason}` : ''}${event.note ? ` · ${event.note}` : ''}`);
}
function contentCheck(v) {
    if (!Array.isArray(v) || v.length > 3000)
        fail('Document content must be a block array.');
    let count = 0;
    const walk = (n, depth = 0) => { if (depth > 24 || ++count > 18000)
        fail('Document is too complex.'); if (Array.isArray(n))
        return n.forEach(x => walk(x, depth + 1)); if (!n || typeof n !== 'object')
        fail('Invalid document node.'); if ('text' in n && typeof n.text !== 'string')
        fail('Invalid text node.'); if (n.url && !/^https?:\/\//i.test(n.url))
        fail('Only HTTP(S) links are allowed.'); if (n.children)
        walk(n.children, depth + 1); };
    walk(v);
    if (new TextEncoder().encode(JSON.stringify(v)).byteLength > 350000)
        fail('Document exceeds the 350 KB editor limit.');
    return clone(v);
}
export function plainText(v) { const parts = []; const walk = n => { if (Array.isArray(n)) {
    n.forEach(walk);
    return;
} if (n && typeof n === 'object') {
    if (typeof n.text === 'string')
        parts.push(n.text);
    if (n.children)
        walk(n.children);
} }; walk(v); return parts.join(' ').replace(/\s+/g, ' ').trim(); }
const blocks = lines => (lines.length ? lines : ['']).map(l => ({ type: l.startsWith('# ') ? 'h1' : l.startsWith('## ') ? 'h2' : 'p', children: [{ text: l.replace(/^#{1,2} /, '') }] }));
function makeDoc(s, c, actor, now) {
    const tpl = DOC_TEMPLATES.find(t => t.id === c.templateId) || DOC_TEMPLATES[0];
    const doc = { id: uid('doc'), title: text(c.title) || tpl.name, description: '', scope: c.scope === 'shared' ? 'shared' : 'personal', folder_id: null, workspace_id: c.workspaceId || 'ws_default', owner_id: actor.id, owner_name: actor.name, content_json: blocks(tpl.lines), plain_text: '', status: 'draft', favorite_user_ids: [], collaborators: [], created_at: now, updated_at: now, updated_by_name: actor.name, archived_at: null, deleted_at: null, versions: [], opportunity_id: c.opportunityId || null };
    entity(s, 'workspaces', doc.workspace_id);
    if (doc.opportunity_id)
        entity(s, 'deals', doc.opportunity_id);
    doc.plain_text = plainText(doc.content_json);
    s.documents.push(doc);
    return doc;
}
function makePlan(s, c, actor, now) {
    const tpl = PLAN_TEMPLATES.find(t => t.id === c.templateId) || PLAN_TEMPLATES[0];
    const start = validDate(c.start_date) || today(new Date(now));
    const p = { id: uid('plan'), name: text(c.name) || tpl.name, description: tpl.description, visibility: c.visibility === 'team' ? 'team' : 'private', owner_id: actor.id, owner_name: actor.name, default_view: 'board', plan_type: 'basic', status: 'active', start_date: start, target_date: '', color: 'olive', groups: tpl.groups.map((name, position) => ({ id: uid('group'), name, position })), labels: [], members: [], created_at: now, updated_at: now, archived_at: null, opportunity_id: c.opportunityId || null, template_id: tpl.id };
    if (p.opportunity_id)
        entity(s, 'deals', p.opportunity_id);
    s.plans.push(p);
    tpl.tasks.forEach(([g, title, offset, list], i) => s.tasks.push({ id: uid('task'), plan_id: p.id, group_id: p.groups.find(x => x.name === g)?.id || null, title, description: '', notes: '', status: 'not_started', priority: 'medium', progress: 0, start_date: start, due_date: offsetDate(start, offset), estimated_minutes: 0, is_milestone: i === tpl.tasks.length - 1, position: i, assignee_ids: [], label_ids: [], checklist: list.map(title => ({ id: uid('check'), title, is_complete: false })), created_at: now, updated_at: now, completed_at: null }));
    return p;
}
/** Single mutation boundary shared by the demo and authenticated server. Clients cannot write arbitrary state. */
export function applyCommand(input, c, actor, at = new Date().toISOString()) {
    if (!actor?.id || !['admin', 'staff', 'viewer'].includes(actor.role))
        fail('Sign in required.', 401);
    if (actor.role === 'viewer')
        fail('This account is read-only.', 403);
    if (!c || typeof c.type !== 'string')
        fail('Invalid operation.');
    const s = clone(input);
    const now = new Date(at).toISOString();
    let resultId = null;
    if (c.type.startsWith('deal.') && c.id && c.type !== 'deal.archive') {
        const current = entity(s, 'deals', c.id);
        if (current.archivedAt)
            fail('Restore the opportunity before making changes.');
    }
    switch (c.type) {
        case 'lead.create': {
            const name = need(c.name, 'Lead name');
            const owner = c.owner || actor.id;
            if (person(s, owner).role === 'viewer')
                fail('Choose an owner who can work opportunities.');
            const lead = { id: uid('lead'), name, company: text(c.company), email: text(c.email), phone: text(c.phone), source: text(c.source) || 'Manual', owner, status: 'new', opportunityId: null, createdAt: now };
            s.leads.push(lead);
            resultId = lead.id;
            break;
        }
        case 'deal.create':
        case 'lead.convert': {
            const lead = c.type === 'lead.convert' ? entity(s, 'leads', c.id) : null;
            if (lead?.opportunityId) {
                resultId = lead.opportunityId;
                break;
            }
            const name = need(c.name || lead?.name, 'Opportunity name');
            const owner = c.owner || lead?.owner || actor.id;
            if (person(s, owner).role === 'viewer')
                fail('Choose an owner who can work opportunities.');
            const email = text(c.email || lead?.email);
            let contact = s.contacts.find(x => email && x.email.toLowerCase() === email.toLowerCase());
            if (!contact) {
                contact = { id: uid('contact'), name: text(c.contactName || lead?.name) || name, company: text(c.client || lead?.company), email, phone: text(c.phone || lead?.phone), type: 'prospect' };
                s.contacts.push(contact);
            }
            const deal = { id: uid('deal'), name, client: text(c.client || lead?.company) || contact.name, contactId: contact.id, contactIds: [], leadId: lead?.id || null, stage: 'new_working', value: num(c.value || 0), probability: (s.stageConfig.new_working || DEFAULT_STAGES.new_working).probability, closeDate: validDate(c.closeDate), owner, opportunityType: c.opportunityType === 'Commercial' ? 'Commercial' : 'Residential', products: [], source: text(c.source || lead?.source) || 'Manual', notes: '', createdAt: now, stageEnteredAt: now, stageHistory: [{ stage: 'new_working', at: now, by: actor.id }], ownerHistory: [{ owner, at: now, by: actor.id }], checklist: {}, extraItems: [], customFields: [], nextStep: null, stalled: null, closedAt: null, archivedAt: null };
            s.deals.push(deal);
            if (lead) {
                lead.opportunityId = deal.id;
                lead.status = 'converted';
            }
            audit(s, deal, actor, now, 'created', 'Opportunity created; owner and source retained.');
            resultId = deal.id;
            break;
        }
        case 'deal.update': {
            const d = entity(s, 'deals', c.id);
            if (d.archivedAt)
                fail('Restore the opportunity first.');
            const p = c.patch || {};
            if ('stage' in p)
                fail('Use the stage transition action.');
            if ('owner' in p)
                ownerChange(s, d, p.owner, actor, now);
            for (const k of ['name', 'client', 'source', 'notes', 'opportunityType'])
                if (k in p)
                    d[k] = k === 'name' ? need(p[k], 'Name') : text(p[k], k === 'notes' ? 12000 : 200);
            if ('value' in p)
                d.value = num(p.value);
            if ('probability' in p)
                d.probability = ['closed_won', 'closed_lost'].includes(d.stage) ? (d.stage === 'closed_won' ? 100 : 0) : num(p.probability, 0, 100);
            if ('closeDate' in p)
                d.closeDate = validDate(p.closeDate);
            if ('products' in p) {
                if (!Array.isArray(p.products) || p.products.length > 30)
                    fail('Invalid services.');
                d.products = p.products.map(x => need(x, 'Service'));
            }
            if ('contactIds' in p) {
                if (!Array.isArray(p.contactIds) || p.contactIds.length > 30)
                    fail('Invalid contacts.');
                d.contactIds = [...new Set(p.contactIds.map(id => entity(s, 'contacts', id).id))];
            }
            audit(s, d, actor, now, 'updated', 'Opportunity details updated.');
            break;
        }
        case 'deal.stage': {
            transition(s, entity(s, 'deals', c.id), c.stage, c, actor, now);
            break;
        }
        case 'deal.archive': {
            const d = entity(s, 'deals', c.id);
            d.archivedAt = c.restore ? null : now;
            audit(s, d, actor, now, 'archive', c.restore ? 'Opportunity restored.' : 'Opportunity archived; history retained.');
            break;
        }
        case 'deal.check': {
            const d = entity(s, 'deals', c.id);
            const stage = oneOf(c.stage, STAGES, 'stage');
            const item = guideFor(s, d, stage).items.find(i => i.id === c.itemId) || fail('Checklist item not found.');
            if (item.auto)
                fail('This step is verified automatically from record fields.');
            d.checklist[`${stage}:${item.id}`] = !!c.done;
            audit(s, d, actor, now, 'checklist', `${item.label}: ${c.done ? 'complete' : 'reopened'}`);
            break;
        }
        case 'deal.extra': {
            const d = entity(s, 'deals', c.id);
            const stage = oneOf(c.stage, STAGES, 'stage');
            if (c.removeId) {
                d.extraItems = d.extraItems.filter(i => i.id !== c.removeId);
            }
            else
                d.extraItems.push({ id: uid('extra'), label: need(c.label, 'Step'), required: !!c.required, stage });
            audit(s, d, actor, now, 'checklist', 'Opportunity-specific checklist updated.');
            break;
        }
        case 'deal.next': {
            const d = entity(s, 'deals', c.id);
            d.nextStep = c.clear ? null : { action: need(c.action, 'Next action'), dueDate: validDate(c.dueDate, true), assignee: person(s, c.assignee || d.owner).id, type: oneOf(c.stepType || 'follow_up', ['call', 'email', 'sms', 'meeting', 'demo', 'proposal', 'follow_up', 'contract', 'other'], 'next step type'), priority: oneOf(c.priority || 'normal', ['low', 'normal', 'high'], 'priority') };
            audit(s, d, actor, now, 'next_step', c.clear ? 'Next step cleared.' : `Next: ${d.nextStep.action} · ${d.nextStep.dueDate}`);
            break;
        }
        case 'deal.stalled': {
            const d = entity(s, 'deals', c.id);
            d.stalled = c.clear ? null : { reason: need(c.reason, 'Stalled reason'), since: now, notes: text(c.notes, 3000), followUpDate: validDate(c.followUpDate) };
            audit(s, d, actor, now, 'stalled', c.clear ? 'Stalled flag cleared.' : d.stalled.reason);
            break;
        }
        case 'deal.field': {
            const d = entity(s, 'deals', c.id);
            if (c.removeId) {
                d.customFields = d.customFields.filter(x => x.id !== c.removeId);
            }
            else {
                const f = { id: c.fieldId || uid('field'), label: need(c.label, 'Field label'), type: oneOf(c.fieldType || 'text', ['text', 'number', 'date'], 'field type'), value: text(c.value, 2000) };
                if (f.type === 'number' && f.value !== '')
                    num(f.value, -1e10, 1e10);
                if (f.type === 'date')
                    validDate(f.value);
                const i = d.customFields.findIndex(x => x.id === f.id);
                if (i < 0)
                    d.customFields.push(f);
                else
                    d.customFields[i] = f;
            }
            audit(s, d, actor, now, 'updated', 'Custom fields updated.');
            break;
        }
        case 'deal.activity': {
            const d = entity(s, 'deals', c.id);
            const kind = oneOf(c.kind || 'note', ['note', 'call', 'email', 'sms', 'voice', 'ai_voice', 'meeting', 'task', 'invoice', 'payment', 'contract'], 'activity type');
            audit(s, d, actor, now, kind, need(c.body, 'Activity', 12000));
            break;
        }
        case 'stage.configure': {
            if (actor.role !== 'admin')
                fail('Stage configuration requires an administrator.', 403);
            const stage = oneOf(c.stage, STAGES, 'stage');
            if (c.reset) {
                delete s.stageConfig[stage];
                break;
            }
            const p = c.config;
            if (!p || !Array.isArray(p.items) || p.items.length > 40 || !Array.isArray(p.actions) || p.actions.length > 20)
                fail('Invalid stage settings.');
            const ids = new Set();
            s.stageConfig[stage] = { label: need(p.label, 'Stage label', 60), probability: stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : num(p.probability, 0, 100), goal: need(p.goal, 'Stage goal', 2000), actions: p.actions.map(a => text(a, 500)).filter(Boolean), items: p.items.map(i => { const id = need(i.id, 'Item ID', 80); if (ids.has(id))
                    fail('Checklist IDs must be unique.'); ids.add(id); const auto = DEFAULT_STAGES[stage].items.find(x => x.id === id)?.auto || null; return { id, label: need(i.label, 'Step label', 300), required: !!i.required, auto }; }) };
            break;
        }
        case 'workspace.create': {
            s.workspaces.push({ id: uid('ws'), name: need(c.name, 'Workspace name') });
            break;
        }
        case 'folder.create': {
            const ws = c.workspaceId || 'ws_default';
            entity(s, 'workspaces', ws);
            const scope = c.scope === 'shared' ? 'shared' : 'personal';
            if (c.parentId) {
                const p = entity(s, 'folders', c.parentId);
                if (p.workspace_id !== ws || (p.scope === 'personal' && p.owner_id !== actor.id))
                    fail('Invalid parent folder.', 403);
            }
            s.folders.push({ id: uid('folder'), name: need(c.name, 'Folder name'), scope, owner_id: actor.id, parent_id: c.parentId || null, workspace_id: ws, created_at: now });
            break;
        }
        case 'document.create': {
            resultId = makeDoc(s, c, actor, now).id;
            break;
        }
        case 'document.save': {
            const d = recordAccess(s, 'documents', c.id, actor);
            if (c.contentRevision !== undefined && c.contentRevision !== (d.content_revision || 0))
                fail('This document changed while you were editing. Your draft was not saved. Reload the document deliberately before replacing it.', 409);
            const title = need(c.title, 'Document title');
            const content = contentCheck(c.content_json);
            d.versions.unshift({ id: uid('version'), at: now, by: actor.name, title: d.title, content_json: clone(d.content_json) });
            d.versions = d.versions.slice(0, 40);
            d.title = title;
            d.content_json = content;
            d.content_revision = (d.content_revision || 0) + 1;
            d.plain_text = plainText(content);
            d.updated_at = now;
            d.updated_by_name = actor.name;
            break;
        }
        case 'document.move': {
            const d = recordAccess(s, 'documents', c.id, actor, 'manage');
            if (c.folderId) {
                const f = entity(s, 'folders', c.folderId);
                if (f.workspace_id !== d.workspace_id || (f.scope === 'personal' && f.owner_id !== actor.id))
                    fail('This folder is unavailable.', 403);
            }
            d.folder_id = c.folderId || null;
            d.updated_at = now;
            break;
        }
        case 'document.favorite': {
            const d = recordAccess(s, 'documents', c.id, actor, 'view');
            d.favorite_user_ids = d.favorite_user_ids.includes(actor.id) ? d.favorite_user_ids.filter(x => x !== actor.id) : [...d.favorite_user_ids, actor.id];
            break;
        }
        case 'document.archive': {
            const d = recordAccess(s, 'documents', c.id, actor, 'manage');
            d.archived_at = c.restore ? null : now;
            break;
        }
        case 'document.share': {
            const d = recordAccess(s, 'documents', c.id, actor, 'manage');
            d.scope = oneOf(c.scope, ['personal', 'shared'], 'scope');
            if (!Array.isArray(c.collaborators) || c.collaborators.length > 100)
                fail('Invalid collaborators.');
            d.collaborators = c.collaborators.map(x => ({ user_id: person(s, x.user_id).id, permission: oneOf(x.permission, ['editor', 'viewer'], 'permission') }));
            break;
        }
        case 'document.restoreVersion': {
            const d = recordAccess(s, 'documents', c.id, actor);
            const v = d.versions.find(x => x.id === c.versionId) || fail('Version not found.');
            d.versions.unshift({ id: uid('version'), at: now, by: actor.name, title: d.title, content_json: clone(d.content_json) });
            d.title = v.title;
            d.content_json = clone(v.content_json);
            d.content_revision = (d.content_revision || 0) + 1;
            d.plain_text = plainText(d.content_json);
            d.versions = d.versions.slice(0, 40);
            d.updated_at = now;
            d.updated_by_name = actor.name;
            break;
        }
        case 'document.comment': {
            const d = recordAccess(s, 'documents', c.id, actor, 'view');
            if (d.archived_at)
                fail('Restore document before commenting.');
            s.comments.push({ id: uid('comment'), document_id: d.id, parent_id: null, author_id: actor.id, author_name: actor.name, body: need(c.body, 'Comment', 8000), quote: text(c.quote, 1000), resolved_at: null, created_at: now });
            break;
        }
        case 'comment.resolve': {
            const m = entity(s, 'comments', c.id);
            recordAccess(s, 'documents', m.document_id, actor, 'view');
            if (actor.role !== 'admin' && m.author_id !== actor.id && !access(entity(s, 'documents', m.document_id), actor).manage)
                fail('Only the author or owner can resolve this comment.', 403);
            m.resolved_at = c.reopen ? null : now;
            break;
        }
        case 'plan.create': {
            if (c.opportunityId) {
                const existing = s.plans.find(p => p.opportunity_id === c.opportunityId && !p.archived_at);
                if (existing && c.once) {
                    if (!access(existing, actor, 'plan').view)
                        fail('A plan already exists; request access from its owner.', 403);
                    resultId = existing.id;
                    break;
                }
            }
            resultId = makePlan(s, c, actor, now).id;
            break;
        }
        case 'plan.update': {
            const p = recordAccess(s, 'plans', c.id, actor, 'manage');
            if (p.archived_at)
                fail('Restore the plan before editing settings.');
            const patch = c.patch || {};
            for (const k of ['name', 'description'])
                if (k in patch)
                    p[k] = k === 'name' ? need(patch[k], 'Plan name') : text(patch[k], 6000);
            if ('visibility' in patch)
                p.visibility = oneOf(patch.visibility, ['private', 'team'], 'visibility');
            if ('default_view' in patch)
                p.default_view = oneOf(patch.default_view, ['board', 'grid', 'list', 'calendar'], 'view');
            if ('target_date' in patch)
                p.target_date = validDate(patch.target_date);
            if ('start_date' in patch)
                p.start_date = validDate(patch.start_date);
            if (p.start_date && p.target_date && p.start_date > p.target_date)
                fail('Target date must follow start date.');
            if ('members' in patch) {
                if (!Array.isArray(patch.members) || patch.members.length > 100)
                    fail('Invalid members.');
                p.members = patch.members.map(m => ({ user_id: person(s, m.user_id).id, role: oneOf(m.role, ['editor', 'member', 'viewer'], 'member role') }));
            }
            p.updated_at = now;
            break;
        }
        case 'plan.archive': {
            const p = recordAccess(s, 'plans', c.id, actor, 'manage');
            p.archived_at = c.restore ? null : now;
            p.status = c.restore ? 'active' : 'archived';
            break;
        }
        case 'plan.group': {
            const p = recordAccess(s, 'plans', c.id, actor);
            if (c.removeId) {
                if (s.tasks.some(t => t.plan_id === p.id && t.group_id === c.removeId))
                    fail('Move tasks out of this group first.');
                p.groups = p.groups.filter(g => g.id !== c.removeId);
            }
            else if (c.groupId) {
                entity({ groups: p.groups }, 'groups', c.groupId).name = need(c.name, 'Group name');
            }
            else
                p.groups.push({ id: uid('group'), name: need(c.name, 'Group name'), position: p.groups.length });
            break;
        }
        case 'plan.label': {
            const p = recordAccess(s, 'plans', c.id, actor);
            p.labels.push({ id: uid('label'), name: need(c.name, 'Label name'), color: oneOf(c.color || 'olive', ['olive', 'blue', 'amber', 'rose'], 'label color') });
            break;
        }
        case 'task.save': {
            const p = recordAccess(s, 'plans', c.planId, actor);
            const old = c.id ? entity(s, 'tasks', c.id) : null;
            if (old && old.plan_id !== p.id)
                fail('Task does not belong to this plan.');
            const patch = c.patch || {};
            const t = old || { id: uid('task'), plan_id: p.id, title: '', group_id: p.groups[0]?.id || null, description: '', notes: '', status: 'not_started', priority: 'medium', progress: 0, start_date: '', due_date: '', estimated_minutes: 0, is_milestone: false, position: s.tasks.filter(t => t.plan_id === p.id).length, assignee_ids: [], label_ids: [], checklist: [], created_at: now, updated_at: now, completed_at: null };
            for (const k of ['title', 'description', 'notes'])
                if (k in patch)
                    t[k] = k === 'title' ? need(patch[k], 'Task title') : text(patch[k], 10000);
            if (!t.title)
                fail('Task title is required.');
            if ('group_id' in patch) {
                if (patch.group_id && !p.groups.some(g => g.id === patch.group_id))
                    fail('Group not found.');
                t.group_id = patch.group_id || null;
            }
            if ('status' in patch)
                t.status = oneOf(patch.status, TASK_STATUS, 'task status');
            if ('priority' in patch)
                t.priority = oneOf(patch.priority, PRIORITIES, 'priority');
            if ('progress' in patch)
                t.progress = num(patch.progress, 0, 100);
            for (const k of ['start_date', 'due_date'])
                if (k in patch)
                    t[k] = validDate(patch[k]);
            if (t.start_date && t.due_date && t.start_date > t.due_date)
                fail('Task due date must follow start date.');
            if ('estimated_minutes' in patch)
                t.estimated_minutes = num(patch.estimated_minutes, 0, 1e6);
            if ('is_milestone' in patch)
                t.is_milestone = !!patch.is_milestone;
            if ('position' in patch)
                t.position = num(patch.position, 0, 1e6);
            if ('assignee_ids' in patch) {
                if (!Array.isArray(patch.assignee_ids) || patch.assignee_ids.length > 100)
                    fail('Invalid assignees.');
                t.assignee_ids = [...new Set(patch.assignee_ids.map(id => { const assignee = person(s, id); if (assignee.role === 'viewer')
                        fail('A read-only user cannot be assigned installation tasks.'); if (p.visibility === 'private' && !access(p, assignee, 'plan').view)
                        fail('Invite the assignee to this private plan first.'); return assignee.id; }))];
            }
            if ('label_ids' in patch) {
                if (!Array.isArray(patch.label_ids) || patch.label_ids.some(id => !p.labels.some(l => l.id === id)))
                    fail('Invalid labels.');
                t.label_ids = [...new Set(patch.label_ids)];
            }
            if ('checklist' in patch) {
                if (!Array.isArray(patch.checklist) || patch.checklist.length > 100)
                    fail('Invalid checklist.');
                t.checklist = patch.checklist.map(x => ({ id: text(x.id) || uid('check'), title: need(x.title, 'Checklist item'), is_complete: !!x.is_complete }));
            }
            if (t.status === 'complete') {
                t.progress = 100;
                t.completed_at = t.completed_at || now;
            }
            else {
                t.completed_at = null;
                if (t.progress === 100)
                    t.progress = 99;
            }
            t.updated_at = now;
            p.updated_at = now;
            if (!old)
                s.tasks.push(t);
            resultId = t.id;
            break;
        }
        case 'task.delete': {
            const t = entity(s, 'tasks', c.id);
            recordAccess(s, 'plans', t.plan_id, actor);
            s.tasks = s.tasks.filter(x => x.id !== t.id);
            break;
        }
        default: fail('Unsupported operation.');
    }
    s.revision = input.revision + 1;
    s.updatedAt = now;
    if (new TextEncoder().encode(JSON.stringify(s)).byteLength > 8000000)
        fail('Workspace capacity reached. Export a backup and expand the storage model.');
    return { state: s, resultId };
}
export function demoState() {
    let s = emptyState();
    const actor = { id: 'demo_owner', name: 'Demo Owner', role: 'admin', email: 'owner@example.test' };
    s.people = [actor, { id: 'demo_staff', name: 'Demo Installer', role: 'staff', email: 'installer@example.test' }, { id: 'demo_viewer', name: 'Demo Viewer', role: 'viewer', email: 'viewer@example.test' }];
    const now = new Date().toISOString();
    const samples = [['Kitchen cabinet refresh', 'Sample Homeowner A', 8500, 'qualified', ['Cabinet Wraps']], ['Office privacy film', 'Sample Business B', 4800, 'proposal', ['Window Film']], ['Feature wall finish', 'Sample Homeowner C', 3200, 'new_working', ['Roman Clay']], ['Commercial wall graphics', 'Sample Business D', 14200, 'opportunity', ['Wall Wraps']]];
    for (const [name, client, value, stage, products] of samples) {
        s = applyCommand(s, { type: 'deal.create', name, client, value, email: `sample${s.deals.length}@example.test`, closeDate: offsetDate(today(), 21) }, actor, now).state;
        const d = s.deals.at(-1);
        d.stage = stage;
        d.probability = DEFAULT_STAGES[stage].probability;
        d.products = products;
        d.nextStep = { action: 'Confirm scope and next milestone', dueDate: offsetDate(today(), 2), assignee: actor.id, type: 'follow_up', priority: 'normal' };
        d.stageHistory.push({ stage, at: now, by: actor.id, note: 'Synthetic demonstration stage' });
    }
    s = applyCommand(s, { type: 'document.create', title: 'Kitchen consultation brief', templateId: 'consultation', scope: 'shared', opportunityId: s.deals[0].id }, actor, now).state;
    s = applyCommand(s, { type: 'plan.create', name: 'Kitchen transformation · sample', templateId: 'surface', visibility: 'team', opportunityId: s.deals[0].id }, actor, now).state;
    return s;
}
