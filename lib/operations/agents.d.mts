import type {AgentAssignment, AgentChannel, AgentId, AgentSettings, AssignmentStatus, OperationState, SkillMode} from './types';
export declare const AGENT_IDS: AgentId[];
export declare const AGENT_CHANNELS: AgentChannel[];
export declare const SKILL_MODES: SkillMode[];
export declare const ASSIGNMENT_STATUSES: AssignmentStatus[];
export declare const ASSIGNMENT_PRIORITIES: AgentAssignment['priority'][];
export declare const DOC_STATUSES: ('draft' | 'active' | 'archived')[];
export declare const AGENT_SKILLS: {id: string; label: string; description: string; agents: AgentId[]}[];
export type AgentView = Required<Pick<AgentSettings, 'name' | 'role' | 'enabled' | 'instructions' | 'endpoint'>> & AgentSettings & {
  id: AgentId;
  platform: string;
  channels: Partial<Record<AgentChannel, boolean>>;
  skills: Record<string, SkillMode>;
};
export declare const AGENT_DEFAULTS: Record<AgentId, AgentView>;
export declare function agentsFor(state: Pick<OperationState, 'agents'>): AgentView[];
export declare function agentCommand(state: OperationState, command: {type: string; [key: string]: unknown}, actor: {id: string; name: string; role: string}, now: string): string;
