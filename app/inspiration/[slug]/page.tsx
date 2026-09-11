import Link from "next/link";
import {notFound} from 'next/navigation';
import {publicPosts} from '@/lib/blog/server';
import {cleanHtml} from '@/lib/blog/model';
import {PageShell} from '@/components/layeredfx/page-shell';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,p=(await publicPosts()).find(p=>p.slug===slug);return {title:p?`${p.meta_title||p.title} | LayeredFX`:'Story not found',description:p?.meta_description||p?.excerpt};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params,p=(await publicPosts()).find(p=>p.slug===slug);if(!p)notFound();return <PageShell><article className="lfx-story"><Link href="/inspiration">← All inspiration</Link><p className="lfx-eyebrow">{p.categories.join(' / ')}</p><h1>{p.title}</h1><p>{p.excerpt}</p>{p.published_at&&<time dateTime={p.published_at}>{new Date(p.published_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Phoenix'})}</time>}{p.featured_image_url&&<img src={p.featured_image_url} alt={p.title}/>}<div className="lfx-story-body" dangerouslySetInnerHTML={{__html:cleanHtml(p.content)}}/>{p.gallery.map((g,i)=><figure key={i}><img src={g.url} alt={g.alt}/><figcaption>{g.caption}</figcaption></figure>)}<div className="lfx-page-actions"><Link href="/studio">Try an idea on your wall ↗</Link><Link href="/book">Book a Consultation ↗</Link></div></article></PageShell>;}
