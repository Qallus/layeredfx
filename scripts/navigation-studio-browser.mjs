import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.LFX_TEST_BASE_URL||'http://localhost:3002';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const checks=[];
try{
 await page.goto(base);await page.locator('.lfx-mega summary').click();assert.equal(await page.locator('.lfx-mega-panel section a').count(),10);
 await page.getByRole('link',{name:'Cabinet wraps',exact:true}).first().click();await page.getByRole('heading',{name:'Cabinet wraps',exact:true}).waitFor();checks.push('Service mega menu and dedicated page');
 for(const route of ['/about','/inspiration','/studio','/admin/blog']){const r=await page.goto(base+route);assert.equal(r.status(),200);}
 const api=async(method,body)=>{const r=await page.request.fetch(base+'/api/blog/manage',{method,headers:{origin:base},...(body?{data:body}:{})});return {status:r.status(),body:await r.json()};};
 let state=(await api('GET')).body;const slug='verification-'+Date.now();
 let created=await api('POST',{revision:state.revision,content_type:'blog_post',title:'Verification story',slug,status:'draft',content:'<p>Our new surface story.</p><script>alert(1)</script>'});assert.equal(created.status,200);
 assert.equal((await page.goto(base+'/inspiration/'+slug)).status(),404);
 let result=await api('PATCH',{...created.body.item,status:'published',revision:created.body.revision});assert.equal(result.status,200);
 assert.equal((await page.goto(base+'/inspiration/'+slug)).status(),200);await page.getByText('Our new surface story.').waitFor();
 assert.equal((await api('PATCH',{...result.body.item,revision:0})).status,409);
 result=await api('PATCH',{...result.body.item,status:'archived',revision:result.body.revision});assert.equal(result.status,200);assert.equal((await page.goto(base+'/inspiration/'+slug)).status(),404);
 assert.equal((await api('DELETE',{id:result.body.item.id,revision:result.body.revision})).status,200);checks.push('Blog draft/publish/detail/archive/delete and stale revision');
 await page.goto(base+'/studio');await page.locator('.ws-vendor-grid article').first().getByRole('button').click();await page.getByRole('status').filter({hasText:'Wilsonart swatch applied'}).waitFor();
 await page.getByLabel('Width (ft)',{exact:true}).fill('20');await page.getByLabel('Height (ft)',{exact:true}).fill('10');await page.getByLabel('Material ($ / sq ft)',{exact:true}).fill('5');await page.getByLabel('Installation ($ / sq ft)',{exact:true}).fill('3');await page.getByText('$1,700.00',{exact:true}).waitFor();checks.push('Wilsonart selection and 200 sq ft estimate with 10% waste');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'docs/reviews/screenshots/studio-upgrade.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.goto(base);await page.getByRole('button',{name:'Open navigation'}).click();await page.locator('.lfx-mobile-services summary').click();await page.locator('.lfx-mobile-services').getByRole('link',{name:'Roman clay',exact:true}).click();await page.getByRole('heading',{name:'Roman clay',exact:true}).waitFor();checks.push('Mobile services menu');
 writeFileSync('docs/reviews/logs/navigation-studio-browser.json',JSON.stringify(checks,null,2));console.log(checks);
}finally{await browser.close();}
