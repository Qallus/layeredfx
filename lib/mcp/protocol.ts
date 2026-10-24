// MCP over Streamable HTTP, stateless: each POST carries one JSON-RPC message and gets one JSON reply.
// No server-initiated streams or sessions are needed because every tool call completes within the request.
import {OperationError} from '@/lib/operations/engine.mjs';
import type {Actor} from '@/lib/operations/types';
import type {Tool} from './tools';

export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
export const SERVER_INFO = {name: 'layeredfx', title: 'LayeredFX Operations', version: '1.0.0'};
export const INSTRUCTIONS = [
  'LayeredFX is an architectural wrap, decorative finish, window film and paint company in Scottsdale, Arizona.',
  'These tools read and update its operations dashboard as the signed-in team member, under their permissions.',
  'Start with get_overview. Use find_leads then import_leads to add leads, and enrich_contact to complete records.',
  'Stage moves follow the LayeredFX pipeline rules; if a move is refused, report the missing steps instead of working around them.',
  'Nothing here sends email, SMS or calls to customers. Prepare customer messages as drafts (for example Gmail drafts) for a team member to review and send, and log what was done with the activity tools.',
].join(' ');

type Message = {jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown};
export type RpcReply = Record<string, unknown> | null;
const reply = (id: unknown, result: unknown) => ({jsonrpc: '2.0', id, result});
const error = (id: unknown, code: number, message: string) => ({jsonrpc: '2.0', id: id ?? null, error: {code, message}});

/** Handles one JSON-RPC message. Notifications (no id) return null and are acknowledged with 202. */
export async function handleMessage(message: Message, actor: Actor, tools: Tool[]): Promise<RpcReply> {
  if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0' || typeof message.method !== 'string') return error(message?.id, -32600, 'Invalid JSON-RPC request.');
  const {id, method} = message, params = (message.params && typeof message.params === 'object' ? message.params : {}) as Record<string, unknown>;
  if (id === undefined || id === null) return null;
  switch (method) {
    case 'initialize': {
      const requested = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      return reply(id, {protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0], capabilities: {tools: {listChanged: false}}, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS});
    }
    case 'ping': return reply(id, {});
    case 'tools/list':
      return reply(id, {tools: tools.map(t => ({name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
        annotations: {title: t.title, readOnlyHint: t.access === 'read' || t.name === 'find_leads', destructiveHint: false, idempotentHint: t.access === 'read', openWorldHint: t.access === 'web'}}))});
    case 'tools/call': {
      const tool = tools.find(t => t.name === params.name);
      if (!tool) return error(id, -32602, `Unknown tool: ${String(params.name).slice(0, 100)}`);
      const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments) ? params.arguments as Record<string, unknown> : {};
      try {
        const result = await tool.run(actor, args);
        return reply(id, {content: [{type: 'text', text: JSON.stringify(result)}], isError: false});
      } catch (e) {
        // Engine and validation messages are written for people and safe to show; anything else stays generic.
        const text = e instanceof OperationError ? e.message : 'The LayeredFX tool failed. No change was confirmed; check before retrying.';
        return reply(id, {content: [{type: 'text', text}], isError: true});
      }
    }
    default: return error(id, -32601, `Method not found: ${method.slice(0, 100)}`);
  }
}
