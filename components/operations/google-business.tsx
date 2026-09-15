"use client";
// Google Business Profile prep. Every listing field comes from lib/business/profile.ts, so what gets pasted into Google
// matches the website and its structured data. This page does not connect to Google; it prepares the listing.
import {useState} from 'react';
import {Check,CheckCircle2,CircleAlert,Copy,ExternalLink} from 'lucide-react';
import {business,businessAddressLine} from '@/lib/business/profile';
import {Button,PageTitle} from './shared';
import './google-business.css';

type ServiceLink={name:string;slug:string};
// Search terms for Google's category picker. Google's list decides the exact category names.
const CATEGORY_IDEAS=['Painter','Window tinting service','Wallpaper installer','Interior construction contractor','Countertop contractor'];
const tagged=(path:string)=>`${business.website}${path}${path.includes('?')?'&':'?'}utm_source=google&utm_medium=organic&utm_campaign=gbp`;

function CopyButton({value,label}:{value:string;label:string}){
 const [copied,setCopied]=useState(false);
 return <button type="button" className="gbp-copy" aria-label={`Copy ${label}`} onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{}}}>{copied?<Check size={14}/>:<Copy size={14}/>}{copied?'Copied':'Copy'}</button>;
}
function Row({label,value,hint,copy=true}:{label:string;value:string;hint?:string;copy?:boolean}){
 return <div className="gbp-row"><div><small>{label}</small><p>{value}</p>{hint&&<span>{hint}</span>}</div>{copy&&<CopyButton value={value} label={label}/>}</div>;
}

export function GoogleBusinessPage({services,indexingEnabled}:{services:ServiceLink[];indexingEnabled:boolean}){
 const serviceArea=business.serviceArea.cities.map(city=>`${city}, ${business.address.region}`).join('; ');
 const checks=[
  {done:true,label:'Business details kept in one place',detail:'The website, its structured data and this page all read lib/business/profile.ts.'},
  {done:true,label:'Website publishes business structured data',detail:'Name, address, phone, hours, service area and services, readable by Google.'},
  {done:true,label:'Sitemap lists the public pages',detail:`${business.website}/sitemap.xml`},
  {done:indexingEnabled,label:'Search engines can index the website',detail:indexingEnabled?'ALLOW_INDEXING is on.':'Set ALLOW_INDEXING=true in Coolify and redeploy so Google can crawl layeredfx.com.'},
  {done:false,label:'Listing created and verified in Google',detail:'Done in Google Business Profile. Verification can take several days.'},
 ];
 return <>
  <PageTitle eyebrow="LAYEREDFX / MARKETING" title="Google Business Profile" description="Everything needed to create and verify the LayeredFX listing, ready to copy."><Button asChild variant="outline"><a href="https://business.google.com/create" target="_blank" rel="noreferrer">Open Google Business Profile <ExternalLink size={14}/></a></Button></PageTitle>
  <p className="ops-info">Not connected to Google yet. Copy these details into the listing exactly as shown. Reviews, posts and insights can be connected after the listing is verified.</p>
  <div className="gbp-grid">
   <section className="gbp-card" aria-labelledby="gbp-details">
    <header><h2 id="gbp-details">Listing details</h2><p>Google compares these with your website, so keep them identical.</p></header>
    <Row label="Business name" value={business.name} hint="Use the real business name only. Don’t add keywords or city names."/>
    <Row label="Address" value={businessAddressLine} hint="Shown to customers. Choose that you also serve customers at their locations."/>
    <Row label="Service area" value={serviceArea} hint={`${business.serviceArea.label}, in ${business.serviceArea.county}.`}/>
    <Row label="Primary phone" value={business.phone.display}/>
    <Row label="Text line" value={business.sms.display} hint="Optional. Add as an additional number only if it answers texts."/>
    <Row label="Website" value={tagged('/')} hint="Tagged so visits from Google are identifiable in analytics."/>
    <Row label="Appointment link" value={tagged('/book')}/>
    <Row label="Email" value={business.email}/>
   </section>
   <div className="gbp-column">
    <section className="gbp-card" aria-labelledby="gbp-hours">
     <header><h2 id="gbp-hours">Hours</h2><p>Regular hours, with Saturdays by appointment.</p></header>
     <Row label="Monday – Friday" value="9:00 AM – 5:00 PM" copy={false}/>
     <Row label="Saturday" value="Closed · by appointment only" hint="Keep Saturday closed in regular hours so no one arrives without an appointment. Mention Saturday appointments in the description."/>
     <Row label="Sunday" value="Closed" copy={false}/>
    </section>
    <section className="gbp-card" aria-labelledby="gbp-readiness">
     <header><h2 id="gbp-readiness">Readiness</h2><p>Website work that is done, and what’s left in Google.</p></header>
     <ul className="gbp-checks">{checks.map(check=><li key={check.label} className={check.done?'is-done':''}>{check.done?<CheckCircle2 size={16} aria-label="Done"/>:<CircleAlert size={16} aria-label="To do"/>}<div><b>{check.label}</b><span>{check.detail}</span></div></li>)}</ul>
    </section>
   </div>
   <section className="gbp-card is-wide" aria-labelledby="gbp-description">
    <header><h2 id="gbp-description">Business description</h2><p>{business.description.length} of 750 characters. Plain description only; no offers, links or unverified claims.</p></header>
    <p className="gbp-description">{business.description}</p>
    <div><CopyButton value={business.description} label="business description"/></div>
   </section>
   <section className="gbp-card" aria-labelledby="gbp-categories">
    <header><h2 id="gbp-categories">Categories</h2><p>Search for these in Google’s category picker and choose the closest matches. The primary category matters most.</p></header>
    <ul className="gbp-tags">{CATEGORY_IDEAS.map(category=><li key={category}>{category}</li>)}</ul>
    <p className="ops-muted">Suggestions to search for, not confirmed Google category names.</p>
   </section>
   <section className="gbp-card" aria-labelledby="gbp-services">
    <header><h2 id="gbp-services">Services</h2><p>Add each one as a service in the listing.</p></header>
    <ul className="gbp-list">{services.map(service=><li key={service.slug}><span>{service.name}</span><a href={`/services/${service.slug}`} target="_blank" rel="noreferrer">View page</a></li>)}</ul>
    <div><CopyButton value={services.map(service=>service.name).join('\n')} label="service list"/></div>
   </section>
   <section className="gbp-card" aria-labelledby="gbp-photos">
    <header><h2 id="gbp-photos">Photos</h2><p>Real photos only.</p></header>
    <ul className="gbp-steps">
     <li><b>Logo:</b> the square LayeredFX app icon, 512 × 512. <a href="/icons/icon-512.png" target="_blank" rel="noreferrer">Open image</a></li>
     <li><b>Cover:</b> the 1200 × 630 LayeredFX brand image. <a href="/images/social-card.png" target="_blank" rel="noreferrer">Open image</a></li>
     <li><b>Office:</b> take photos of the Osborn Dr entrance and interior so customers recognize the location.</li>
     <li><b>Team and work:</b> add real team photos, and photos of finished projects only with the client’s approval. Don’t upload concept renders as completed work.</li>
    </ul>
   </section>
   <section className="gbp-card" aria-labelledby="gbp-steps">
    <header><h2 id="gbp-steps">Setup steps</h2><p>Full guide: docs/GOOGLE_BUSINESS_PROFILE.md</p></header>
    <ol className="gbp-steps">
     <li>Sign in with the Google account LayeredFX will keep long term.</li>
     <li>Add the business name and primary category, then the address, and choose that you also visit customers.</li>
     <li>Add the Greater Phoenix service area, primary phone and tagged website link.</li>
     <li>Request verification using the method Google offers.</li>
     <li>After verification, add hours, description, services and photos.</li>
     <li>Share Google’s review link with customers after real completed jobs.</li>
    </ol>
   </section>
  </div>
 </>;
}
