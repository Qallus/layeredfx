// Sends queued assignments to the LayeredFX agent services and tests those connections.
// The assignment is read from stored state by id, so a client cannot choose what is sent. Every state change
// still goes through applyCommand with the revision check, and no key or provider body is returned.
import {applyCommand, OperationError, visibleState} from '@/lib/operations/engine.mjs';
import {readBody} from '@/lib/operations/security.mjs';
import {checkOrigin, currentActor, errorResponse, mode, readState, writeState} from '@/lib/operations/server';
import {agentFailure, agentThrottle, hermesChat, hermesHealth, paperclipAgents, paperclipCreateIssue, paperclipHealth} from '@/lib/agents/client';
import type {Actor, AgentAssignment, Command, OperationState} from '@/lib/operations/types';

export const dynamic = 'force-dynamic';
const headers = {'Cache-Control': 'private, no-store', Vary: 'Cookie'};
type Context = {params: Promise<{action: string}>};
const EVE_SYSTEM = 'You are Eve, the LayeredFX operations assistant. Reply with a short, practical draft or plan for the task. A LayeredFX team member reviews everything before anything reaches a customer.';

/** Applies one command at a time against a fresh read, keeping the compare-and-swap revision check. */
async function apply(actor: Actor, commands: Command[]): Promise<OperationState> {
  let latest: OperationState | null = null;
  for (const command of commands) {
    const current = await readState();
    const result = applyCommand(current, command, actor);
    await writeState(result.state, current.revision);
    latest = result.state as OperationState;
  }
  return latest ?? await readState();
}

/** What the agent is told: the assignment plus the records and training documents it is linked to. */
function brief(state: OperationState, assignment: AgentAssignment) {
  const deal = state.deals.find(item => item.id === assignment.dealId);
  const contact = state.contacts.find(item => item.id === assignment.contactId);
  const docs = (state.agentDocs || []).filter(doc => doc.status === 'active' && doc.agents.includes(assignment.agent)).map(doc => doc.title);
  return [
    assignment.details,
    `Priority: ${assignment.priority}`,
    assignment.dueDate ? `Due: ${assignment.dueDate}` : '',
    deal ? `Opportunity: ${deal.name}` : '',
    contact ? `Contact: ${contact.name}` : '',
    docs.length ? `Training documents: ${docs.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

async function verify(actor: Actor, body: Record<string, unknown>) {
  if (actor.role !== 'admin') throw new OperationError('Only administrators can test agent connections.', 403);
  const service = body.service === 'eve' || body.service === 'paperclip' ? body.service : '';
  if (!service) throw new OperationError('Choose a service to test.', 400);
  const checks = service === 'eve' ? await hermesHealth() : await paperclipHealth();
  if (service === 'paperclip' && checks.every(check => check.ok)) {
    // Confirms the key can actually read the company, not just that the address answers.
    const agents = await paperclipAgents().catch(() => null);
    if (!agents) checks.push({name: 'Agents', ok: false, detail: 'The company agents could not be read.'});
  }
  const ok = checks.every(check => check.ok);
  return Response.json({id: service, ok, checks, message: ok ? 'Connection confirmed.' : 'The connection did not pass. See the checks above.'}, {headers});
}

async function send(actor: Actor, body: Record<string, unknown>) {
  const id = typeof body.id === 'string' ? body.id : '';
  const state = await readState();
  const assignment = (state.agentAssignments || []).find(item => item.id === id);
  if (!assignment) throw new OperationError('Assignment not found.', 404);
  if (actor.role !== 'admin' && assignment.createdBy !== actor.id) throw new OperationError('Only the person who assigned this or an administrator can send it.', 403);
  if (assignment.agent === 'voice') throw new OperationError('The voice agent answers phone calls; it cannot take queue work.', 400);
  if (['done', 'canceled'].includes(assignment.status)) throw new OperationError('This assignment is closed. Reopen it before sending.', 400);
  if (assignment.delivery?.state === 'sent') throw new OperationError('This assignment was already sent. Create a new assignment instead.', 409);

  const service = assignment.agent === 'paperclip' ? 'paperclip' : 'hermes';
  const requestId = `lfx-${assignment.id}-${(assignment.delivery?.attempts || 0) + 1}`;
  const description = brief(state, assignment);
  let externalId = '', externalUrl = '', reply = '', confirmed = true, message = '';
  try {
    if (service === 'paperclip') {
      const priority = assignment.priority === 'high' ? 'high' : assignment.priority === 'low' ? 'low' : 'medium';
      const issue = await paperclipCreateIssue({title: assignment.title, description, priority, marker: requestId});
      externalId = issue.id; externalUrl = issue.url; confirmed = issue.confirmed;
      message = issue.confirmed
        ? `Sent to Paperclip. Task ${issue.id} created.`
        : 'Paperclip saved the task but did not confirm it. Check team.layeredfx.com before sending it again.';
    } else {
      const answer = await hermesChat({system: EVE_SYSTEM, prompt: `${assignment.title}\n\n${description}`});
      externalId = answer.id; reply = answer.text;
      message = 'Eve replied. Her answer is in the assignment history.';
    }
  } catch (error) {
    // Record the failed attempt without losing the queued assignment, then report the failure honestly.
    const detail = error instanceof OperationError ? error.message : 'The agent service did not confirm the request.';
    try { await apply(actor, [{type: 'agent.assignment.result', id: assignment.id, outcome: 'failed', service, detail, requestId}]); } catch { /* the original failure is what matters */ }
    throw error;
  }

  const commands: Command[] = [{type: 'agent.assignment.result', id: assignment.id, outcome: 'sent', service, externalId, externalUrl, requestId}];
  if (reply) commands.push({type: 'agent.assignment.update', id: assignment.id, note: `Eve: ${reply.slice(0, 900)}`});
  const next = await apply(actor, commands);
  return Response.json({state: visibleState(next, actor), assignmentId: assignment.id, externalId, confirmed, message}, {headers});
}

export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const actor = await currentActor();
    if (actor.role === 'viewer') throw new OperationError('This account is read-only.', 403);
    if (!request.headers.get('content-type')?.includes('application/json')) throw new OperationError('JSON is required.', 415);
    const {action} = await context.params;
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(await readBody(request, 4000));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch (e) {
      if (e instanceof OperationError) throw e;
      throw new OperationError('Valid JSON object is required.', 400);
    }
    // Demo mode has no agent keys and must never reach a provider.
    if (mode() === 'demo') throw new OperationError('The local demo has no agent keys. Agents run on the deployed site only.', 503);
    agentThrottle(actor);
    if (action === 'send') return await send(actor, body);
    if (action === 'verify') return await verify(actor, body);
    throw new OperationError('Unknown agent action.', 404);
  } catch (e) { return errorResponse(agentFailure(e)); }
}
