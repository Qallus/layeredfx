import 'server-only';
// Operations state for MCP tools. Live mode reads and writes the LayeredFX store with the compare-and-swap revision
// check; a stale write fails and is reported, never retried. The development demo keeps its own in-memory copy,
// separate from the browser demo (which lives in each browser's localStorage).
import {applyCommand, demoState, visibleState} from '@/lib/operations/engine.mjs';
import {mode, readState, writeState} from '@/lib/operations/server';
import type {Actor, Command, OperationState} from '@/lib/operations/types';

const memory = () => ((globalThis as {__lfxMcpState?: OperationState}).__lfxMcpState ||= demoState());

export async function loadState(actor: Actor): Promise<OperationState> {
  return visibleState(mode() === 'demo' ? memory() : await readState(), actor);
}

/** One command against a fresh read. Returns the new visible state and the command's result id. */
export async function applyAs(actor: Actor, command: Command): Promise<{state: OperationState; resultId: string | null}> {
  if (mode() === 'demo') {
    const result = applyCommand(memory(), command, actor);
    (globalThis as {__lfxMcpState?: OperationState}).__lfxMcpState = result.state;
    return {state: visibleState(result.state, actor), resultId: result.resultId};
  }
  const current = await readState();
  const result = applyCommand(current, command, actor);
  await writeState(result.state, current.revision);
  return {state: visibleState(result.state, actor), resultId: result.resultId};
}
