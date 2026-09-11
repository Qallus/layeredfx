import {PageShell} from '@/components/layeredfx/page-shell';
import {servicePages} from '@/lib/layeredfx/service-pages';
export const metadata={title:'Services | LayeredFX'};
export default function Page(){return <PageShell><span className="lfx-eyebrow">WHAT WE DO</span><h1>A surface for every possibility.</h1><p>Explore finishes for the spaces you live and work in.</p><div className="lfx-editorial-grid">{servicePages.map(s=><a className="lfx-service-card" key={s.slug} href={`/services/${s.slug}`}><h2>{s.name} ↗</h2><p>{s.description}</p></a>)}</div></PageShell>;}
