import type {OperationState,ProfileGroup} from '@/lib/operations/types';

// Groups in the order they appear on the About page. Keep in sync with PROFILE_GROUPS in lib/operations/engine.mjs.
export const PROFILE_GROUP_LABELS: Record<ProfileGroup, {label: string; plural: string}> = {
  team: {label: 'LFX Team', plural: 'LFX Team'},
  installer: {label: 'Installer', plural: 'Installers'},
  designer: {label: 'Designer / Artist', plural: 'Designers & Artists'},
  contractor: {label: 'General contractor', plural: 'General Contractors'},
  vendor: {label: 'Vendor', plural: 'Vendors'},
};
export const PARTNER_GROUPS: ProfileGroup[] = ['installer', 'designer', 'contractor', 'vendor'];

/** The only profile fields that ever leave the dashboard. */
export type PublicProfile = {id: string; name: string; title: string; company: string; location: string; tagline: string; bio: string; photoUrl: string; website: string; attributes: string[]; email: string; phone: string};
export type PublicProfileGroup = {group: ProfileGroup; label: string; plural: string; profiles: PublicProfile[]};

const https = (value?: string) => {
  if (!value) return '';
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
};

/**
 * Builds the About page directory: only active profiles explicitly marked public, grouped and ordered.
 * Email and phone are included only when the profile allows it; internal fields are never copied.
 */
export function publicProfiles(state: Pick<OperationState, 'team'>): PublicProfileGroup[] {
  const byGroup = new Map<ProfileGroup, PublicProfile[]>();
  for (const member of [...(state.team || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))) {
    const group = (member.group || 'team') as ProfileGroup;
    if (member.visibility !== 'public' || member.status !== 'active' || !(group in PROFILE_GROUP_LABELS)) continue;
    const list = byGroup.get(group) || [];
    list.push({
      id: member.id, name: member.name, title: member.title || '', company: member.company || '', location: member.location || '',
      tagline: member.tagline || '', bio: member.bio || '', photoUrl: https(member.photoUrl), website: https(member.website),
      attributes: Array.isArray(member.attributes) ? member.attributes : [],
      email: member.showContact === true ? member.email || '' : '', phone: member.showContact === true ? member.phone || '' : '',
    });
    byGroup.set(group, list);
  }
  return (Object.keys(PROFILE_GROUP_LABELS) as ProfileGroup[])
    .map(group => ({group, ...PROFILE_GROUP_LABELS[group], profiles: byGroup.get(group) || []}))
    .filter(group => group.profiles.length);
}
