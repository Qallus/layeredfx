import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialPortal,portalCommand} from '../lib/portal/model.ts';
const account=(kind='residential',status='active')=>({user_id:'customer-a',org_id:'layeredfx',email:'a@example.test',kind,status,revision:0,state:initialPortal('Customer A')});
const request={type:'item',kind:'booking',title:'Site visit',body:'Review kitchen surfaces.',date:'2026-10-10'};
test('portal booking is a request, never auto-confirmed',()=>{const original=account(),next=portalCommand(original,request);assert.equal(next.state.items[0].status,'requested');assert.equal(next.revision,1);assert.equal(original.state.items.length,0);assert.equal(next.user_id,original.user_id);});
test('pending partners can update profile but cannot submit requests',()=>{const a=account('vendor','pending');assert.throws(()=>portalCommand(a,request),/approval/);const next=portalCommand(a,{type:'profile',profile:{name:'Vendor',company:'Company',phone:'',address:'',status:'active'}});assert.equal(next.status,'pending');});
test('portal self approval and status spoofing are denied',()=>{assert.throws(()=>portalCommand(account('contractor','pending'),{type:'approval',status:'active'}),/Administrator/);const a=portalCommand(account(),request);assert.throws(()=>portalCommand(a,{type:'status',id:a.state.items[0].id,status:'confirmed'}));});
test('staff may approve partner and reply without spoofing customer authorship',()=>{const approved=portalCommand(account('contractor','pending'),{type:'approval',status:'active'},true);const reply=portalCommand(approved,{type:'item',kind:'message',title:'Welcome',body:'Your access is ready.'},true);assert.equal(reply.state.items[0].author,'team');});
test('customers cannot submit partner referrals',()=>{assert.throws(()=>portalCommand(account(),{...request,kind:'referral'}),/Partner/);});
test('client cannot replace media, state or owner fields via commands',()=>{assert.throws(()=>portalCommand(account(),{type:'media',path:'another-account/private.png'}));const a=portalCommand(account(),{...request,user_id:'customer-b',status:'confirmed',author:'team'});assert.equal(a.user_id,'customer-a');assert.equal(a.state.items[0].author,'account');});
test('invalid calendar date and oversized messages rejected',()=>{assert.throws(()=>portalCommand(account(),{...request,date:'2026-02-31'}),/valid date/);assert.throws(()=>portalCommand(account(),{...request,body:'x'.repeat(4001)}),/oversized/);});
test('suspended accounts cannot change profiles',()=>{assert.throws(()=>portalCommand(account('commercial','suspended'),{type:'profile',profile:{name:'A',company:'',phone:'',address:''}}));});
test('customers cancel only their pending requests and retain history',()=>{const a=portalCommand(account(),request),id=a.state.items[0].id;const next=portalCommand(a,{type:'status',id,status:'cancelled'});assert.equal(next.state.items[0].status,'cancelled');assert.equal(next.state.items[0].body,request.body);assert.throws(()=>portalCommand(next,{type:'status',id,status:'cancelled'}));});

const {mediaError,MEDIA_LIMIT,MEDIA_MAX_BYTES,MEDIA_TYPES}=await import('../lib/portal/model.ts');
const photo=(over={})=>({type:'image/jpeg',size:2_000_000,...over});
test('portal media rules match what the upload route enforces',()=>{
 assert.equal(mediaError(photo(),0),'');
 assert.equal(mediaError(photo({type:'video/mp4'}),99),'');
 assert.match(mediaError(photo({type:'image/gif'}),0),/JPEG, PNG, WebP, MP4 or WebM/);
 assert.match(mediaError(photo({type:'application/pdf'}),0),/JPEG/);
 assert.match(mediaError(photo({size:MEDIA_MAX_BYTES+1}),0),/under 20 MB/);
 assert.match(mediaError(photo({size:0}),0),/empty/);
 assert.match(mediaError(photo(),MEDIA_LIMIT),new RegExp(String(MEDIA_LIMIT)));
 // The limit is checked before the file type, so a full library gives the clearer reason.
 assert.match(mediaError(photo({type:'image/gif'}),MEDIA_LIMIT),/up to 100 files/);
 assert.deepEqual(MEDIA_TYPES,['image/jpeg','image/png','image/webp','video/mp4','video/webm']);
});

test('the portal upload control allows several files at once',()=>{
 const source=readFileSync(new URL('../components/portal/media.tsx',import.meta.url),'utf8');
 assert.match(source,/multiple/);
 assert.match(source,/x-portal-revision/);
 // Uploads are sequential: each one uses the revision the server returned for the previous file.
 assert.match(source,/for \(let i = 0; i < files\.length; i\+\+\)/);
 assert.doesNotMatch(source,/Promise\.all\(/);
});
