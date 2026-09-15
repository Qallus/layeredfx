import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';
const moduleUrl=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const engine=new URL('../lib/operations/engine.mjs',import.meta.url).href;
let code=ts.transpileModule(readFileSync(new URL('../lib/communications/email.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
code=code.replace(/import ['"]server-only['"];?/,'').replaceAll('@/lib/operations/engine.mjs',engine);
const email=await import(moduleUrl(code));
const actor={id:'staff_1',name:'Staff',role:'staff'};
const valid={to:'client@example.com',subject:'Your quote',body:'Hello <b>there</b>\nThanks',requestId:'req-12345678'};
const calls=[];const realFetch=globalThis.fetch;
test.beforeEach(()=>{calls.length=0;process.env.LFX_RESEND_API_KEY='re_test';process.env.LFX_EMAIL_FROM='LayeredFX <hello@layeredfx.com>';delete process.env.LFX_EMAIL_REPLY_TO;globalThis.fetch=async(url,init)=>{calls.push({url,init});return Response.json({id:'em_123'});};});
test.after(()=>{globalThis.fetch=realFetch;});
test('compose input is validated before anything is sent',()=>{
  for(const patch of [{to:'not-an-email'},{subject:''},{subject:'Line one\nBcc: someone@example.com'},{body:''},{body:'x'.repeat(10001)},{requestId:'bad id'}])assert.throws(()=>email.staffEmailInput({...valid,...patch}),e=>e.status===400);
  assert.deepEqual(email.staffEmailInput(valid),{to:valid.to,subject:valid.subject,text:valid.body,requestId:valid.requestId});
});
test('an unconfigured provider refuses without calling Resend',async()=>{
  delete process.env.LFX_RESEND_API_KEY;assert.equal(email.emailConfigured(),false);
  await assert.rejects(email.sendStaffEmail(email.staffEmailInput(valid),actor),e=>e.status===503);assert.equal(calls.length,0);
});
test('sends with the fixed sender, an idempotency key per request and escaped HTML',async()=>{
  const result=await email.sendStaffEmail(email.staffEmailInput({...valid,from:'attacker@evil.example'}),actor);
  assert.deepEqual(result,{id:'em_123'});assert.equal(calls.length,1);
  const{url,init}=calls[0];assert.equal(url,'https://api.resend.com/emails');assert.equal(init.headers['Idempotency-Key'],'lfx-staff-staff_1-req-12345678');
  const payload=JSON.parse(init.body);assert.equal(payload.from,'LayeredFX <hello@layeredfx.com>');assert.deepEqual(payload.to,['client@example.com']);assert.equal(payload.text,valid.body);
  assert.match(payload.html,/Hello &lt;b&gt;there&lt;\/b&gt;<br\/>Thanks/);
});
test('provider rejection and network failure report that nothing was confirmed',async()=>{
  globalThis.fetch=async()=>new Response('rejected',{status:422});
  await assert.rejects(email.sendStaffEmail(email.staffEmailInput(valid),actor),e=>e.status===502&&/did not accept/.test(e.message));
  globalThis.fetch=async()=>{throw new Error('offline');};
  await assert.rejects(email.sendStaffEmail(email.staffEmailInput(valid),actor),e=>e.status===502&&/did not respond/.test(e.message));
});
