// Server-only readiness checks for the AI agent services. Reports which variables are set, never their values.
export type AgentServiceId = 'eve' | 'paperclip' | 'voice';
export type AgentConnection = {id: AgentServiceId; configured: boolean; missing: string[]; optionalMissing: string[]; address: string};

export const AGENT_ENV: Record<AgentServiceId, {required: string[]; optional: string[]; addressVar?: string}> = {
  // LFX_HERMES_API_KEY is the Hermes API_SERVER_KEY (Bearer token for its OpenAI-compatible API).
  eve: {required: ['LFX_HERMES_URL', 'LFX_HERMES_API_KEY'], optional: ['LFX_HERMES_MODEL'], addressVar: 'LFX_HERMES_URL'},
  // Paperclip API: Bearer agent API key; tasks are issues under /api/companies/{companyId}.
  paperclip: {required: ['LFX_PAPERCLIP_URL', 'LFX_PAPERCLIP_API_KEY', 'LFX_PAPERCLIP_COMPANY_ID'], optional: ['LFX_PAPERCLIP_AGENT_ID'], addressVar: 'LFX_PAPERCLIP_URL'},
  // xAI Voice Agent API (wss://api.x.ai/v1/realtime). The key must never reach the browser.
  voice: {required: ['LFX_XAI_API_KEY'], optional: ['LFX_XAI_VOICE_MODEL', 'LFX_XAI_VOICE']},
};

const isSet = (env: NodeJS.ProcessEnv, name: string) => Boolean(env[name]?.trim());
function httpsOrigin(value: string | undefined) {
  try { const url = new URL(value || ''); return url.protocol === 'https:' && !url.username && !url.password ? url.origin : ''; } catch { return ''; }
}

export function agentConnections(env: NodeJS.ProcessEnv = process.env): AgentConnection[] {
  return (Object.keys(AGENT_ENV) as AgentServiceId[]).map(id => {
    const spec = AGENT_ENV[id];
    const address = spec.addressVar ? httpsOrigin(env[spec.addressVar]) : '';
    // A URL variable only counts when it is a valid https address.
    const missing = spec.required.filter(name => name === spec.addressVar ? !address : !isSet(env, name));
    return {id, configured: missing.length === 0, missing, optionalMissing: spec.optional.filter(name => !isSet(env, name)), address};
  });
}
