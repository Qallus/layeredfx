import type {PublicProfile, PublicProfileGroup} from '@/lib/profiles/public';

// Team and partner profiles published from the dashboard (CMS > LFX Team / Partners). Renders nothing when none are public.
export function AboutProfiles({groups}: {groups: PublicProfileGroup[]}) {
  const team = groups.find(group => group.group === 'team');
  const partners = groups.filter(group => group.group !== 'team');
  if (!team && !partners.length) return null;
  return <>
    {team && <section className="lfx-about-people" aria-labelledby="about-team">
      <span className="lfx-eyebrow">THE PEOPLE BEHIND THE WORK</span>
      <h2 id="about-team">Meet the LFX Team</h2>
      <div className="lfx-profile-grid">{team.profiles.map(profile => <ProfileCard key={profile.id} profile={profile}/>)}</div>
    </section>}
    {partners.length > 0 && <section className="lfx-about-people" aria-labelledby="about-partners">
      <span className="lfx-eyebrow">OUR NETWORK</span>
      <h2 id="about-partners">Partners we work with</h2>
      {partners.map(group => <div className="lfx-profile-group" key={group.group}>
        <h3>{group.plural}</h3>
        <div className="lfx-profile-grid">{group.profiles.map(profile => <ProfileCard key={profile.id} profile={profile}/>)}</div>
      </div>)}
    </section>}
  </>;
}

function ProfileCard({profile}: {profile: PublicProfile}) {
  const initials = profile.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const role = [profile.title, profile.company].filter(Boolean).join(' · ');
  return <article className="lfx-profile-card">
    {profile.photoUrl ? <img src={profile.photoUrl} alt={`Portrait of ${profile.name}`} loading="lazy"/> : <span className="lfx-profile-initials" aria-hidden="true">{initials}</span>}
    <div>
      <h4>{profile.name}</h4>
      {role && <p className="lfx-profile-role">{role}</p>}
      {profile.location && <p className="lfx-profile-meta">{profile.location}</p>}
      {profile.tagline && <p className="lfx-profile-tagline">{profile.tagline}</p>}
      {profile.bio && <p className="lfx-profile-bio">{profile.bio}</p>}
      {profile.attributes.length > 0 && <ul className="lfx-profile-tags">{profile.attributes.map(attribute => <li key={attribute}>{attribute}</li>)}</ul>}
      {(profile.website || profile.email || profile.phone) && <div className="lfx-profile-links">
        {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}
        {profile.email && <a href={`mailto:${profile.email}`}>{profile.email}</a>}
        {profile.phone && <a href={`tel:${profile.phone}`}>{profile.phone}</a>}
      </div>}
    </div>
  </article>;
}
