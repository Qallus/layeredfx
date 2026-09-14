import {PageShell} from '@/components/layeredfx/page-shell';
import {ContactForm} from '@/components/layeredfx/contact-form';
import '@/components/layeredfx/contact.css';
export const metadata={title:'Communication Opt-Out | LayeredFX'};
export default function Page(){return <PageShell><div className="lfx-preferences"><h1>Communication Opt-Out</h1><p>Manage SMS and email preferences for LayeredFX. For SMS assistance, reply HELP. To stop texts, reply STOP. You can also reach us at hello@layeredfx.com or (480) 999-9906.</p><ContactForm kind="opt-out"/></div></PageShell>;}
