export type Role = 'admin' | 'staff' | 'viewer';
export interface Actor {
    id: string;
    name: string;
    email?: string;
    role: Role;
}
export type Stage = 'new_working' | 'contacted' | 'qualified' | 'opportunity' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurture';
export interface StageItem {
    id: string;
    label: string;
    required: boolean;
    auto?: string | null;
    stage?: Stage;
}
export interface StageGuide {
    label: string;
    probability: number;
    goal: string;
    actions: string[];
    items: StageItem[];
}
export interface Contact {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    type: string;
    firstName?: string;
    lastName?: string;
    title?: string;
    status?: 'active'|'inactive'|'archived';
    owner?: string;
    source?: string;
    tags?: string[];
    city?: string;
    state?: string;
    address?: string;
    zip?: string;
    website?: string;
    sms?: string;
    notes?: string;
    lastContact?: string;
    createdAt?: string;
    updatedAt?: string;
    userId?: string|null;
    details?: Record<string,string>;
}
export interface Lead {
    contactId?: string;
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    source: string;
    owner: string;
    status: string;
    opportunityId: string | null;
    createdAt: string;
}
export interface Deal {
    id: string;
    name: string;
    client: string;
    contactId: string;
    contactIds: string[];
    leadId: string | null;
    stage: Stage;
    value: number;
    probability: number;
    closeDate: string;
    owner: string;
    opportunityType: string;
    products: string[];
    source: string;
    notes: string;
    createdAt: string;
    stageEnteredAt: string;
    stageHistory: {
        stage: Stage;
        from?: Stage;
        at: string;
        by: string;
        note?: string;
        overrideReason?: string;
    }[];
    ownerHistory: {
        owner: string;
        at: string;
        by: string;
    }[];
    checklist: Record<string, boolean>;
    extraItems: StageItem[];
    customFields: {
        id: string;
        label: string;
        type: 'text' | 'number' | 'date';
        value: string;
    }[];
    nextStep: {
        action: string;
        dueDate: string;
        assignee: string;
        type: string;
        priority: string;
    } | null;
    stalled: {
        reason: string;
        since: string;
        notes: string;
        followUpDate: string;
    } | null;
    closedAt: string | null;
    archivedAt: string | null;
    wonSummary?: string;
    lostReason?: string;
    lostNotes?: string;
    competitor?: string;
    reopenedAt?: string;
}
export interface Activity {
    id: string;
    dealId: string;
    kind: string;
    body: string;
    actor: string;
    actorId: string;
    occurredAt: string;
}
export interface Workspace {
    id: string;
    name: string;
}
export interface Folder {
    id: string;
    name: string;
    scope: 'personal' | 'shared';
    owner_id: string;
    parent_id: string | null;
    workspace_id: string;
    created_at: string;
}
export interface Document {
    content_revision?: number;
    id: string;
    title: string;
    description: string;
    scope: 'personal' | 'shared';
    folder_id: string | null;
    workspace_id: string;
    owner_id: string;
    owner_name: string;
    content_json: unknown[];
    plain_text: string;
    status: string;
    favorite_user_ids: string[];
    collaborators: {
        user_id: string;
        permission: 'viewer' | 'editor';
    }[];
    created_at: string;
    updated_at: string;
    updated_by_name: string;
    archived_at: string | null;
    deleted_at: string | null;
    versions: {
        id: string;
        at: string;
        by: string;
        title: string;
        content_json: unknown[];
    }[];
    opportunity_id: string | null;
}
export interface Comment {
    id: string;
    document_id: string;
    parent_id: string | null;
    author_id: string;
    author_name: string;
    body: string;
    quote: string;
    resolved_at: string | null;
    created_at: string;
}
export interface Plan {
    id: string;
    name: string;
    description: string;
    visibility: 'private' | 'team';
    owner_id: string;
    owner_name: string;
    default_view: 'board' | 'grid' | 'list' | 'calendar';
    plan_type: 'basic' | 'premium';
    status: string;
    start_date: string;
    target_date: string;
    color: string;
    groups: {
        id: string;
        name: string;
        position: number;
    }[];
    labels: {
        id: string;
        name: string;
        color: string;
    }[];
    members: {
        user_id: string;
        role: 'editor' | 'member' | 'viewer';
    }[];
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    opportunity_id: string | null;
    template_id: string;
}
export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'blocked' | 'complete';
export interface Task {
    id: string;
    plan_id: string;
    group_id: string | null;
    title: string;
    description: string;
    notes: string;
    status: TaskStatus;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    progress: number;
    start_date: string;
    due_date: string;
    estimated_minutes: number;
    is_milestone: boolean;
    position: number;
    assignee_ids: string[];
    label_ids: string[];
    checklist: {
        id: string;
        title: string;
        is_complete: boolean;
    }[];
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}
export interface OperationState {
    contactActivities?: {id:string;contactId:string;kind:string;body:string;actorId:string;occurredAt:string}[];
    directMessages?: {id:string;senderId:string;recipientId:string;body:string;createdAt:string}[];
    quickNotes?: {id:string;ownerId:string;title:string;body:string;updatedAt:string;revision?:number}[];
    schemaVersion: 2;
    revision: number;
    updatedAt: string | null;
    people: Actor[];
    contacts: Contact[];
    leads: Lead[];
    deals: Deal[];
    stageConfig: Partial<Record<Stage, StageGuide>>;
    activities: Activity[];
    workspaces: Workspace[];
    folders: Folder[];
    documents: Document[];
    comments: Comment[];
    plans: Plan[];
    tasks: Task[];
    projects: {
        id: string;
        opportunityId: string;
        name: string;
        contactId: string;
        owner: string;
        status: string;
        createdAt: string;
    }[];
}
export type Command = {
    type: string;
    id?: string;
    [key: string]: unknown;
};
