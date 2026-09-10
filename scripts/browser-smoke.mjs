import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];const checks=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.LFX_TEST_BASE_URL||'http://127.0.0.1:3000';
mkdirSync('docs/reviews/screenshots',{recursive:true});
try {
 for(const path of ['/','/admin','/admin/pipeline','/admin/pipeline/stages','/admin/workspace','/admin/plans','/admin/coupons']) {
  const response=await page.goto(base+path);
  await page.locator('h1').first().waitFor();
  if(path.startsWith('/admin'))await page.locator('.ops-sidebar').waitFor();
  checks.push({path,status:response.status(),heading:await page.locator('h1').first().innerText()});
  if(response.status()!==200)throw new Error(`${path} returned ${response.status()}`);
  if(path==='/') {
   await page.locator('#studio').scrollIntoViewIfNeeded();
   await page.locator('canvas').waitFor({timeout:30000});
   checks.push({name:'Three.js canvas',count:await page.locator('canvas').count()});
   await page.screenshot({path:'docs/reviews/screenshots/homepage-desktop.png',fullPage:true});
  }
  if(path==='/admin/pipeline'){
   const views=page.locator('.ops-views button');
   for(const name of ['List','Table','Cards','Calendar','Board']) {await views.filter({hasText:new RegExp(`^${name}$`,'i')}).click();checks.push({name:`Pipeline ${name}`,visible:true});}
  }
  if(path==='/admin/workspace') {
   const link=page.locator('a[href^="/admin/workspace/"]').first();
   if(await link.count()){
    await link.click();await page.locator('[contenteditable="true"]').waitFor({timeout:30000});
    checks.push({name:'Plate editor renders',path:new URL(page.url()).pathname});
    const editor=page.locator('[contenteditable="true"]');
    await editor.click();await page.keyboard.press('Control+End');await page.keyboard.type(' Browser persistence check.');
    page.once('dialog',dialog=>dialog.dismiss());
    await page.locator('.ops-sidebar').getByRole('link',{name:'Plans',exact:true}).click();
    if(!page.url().includes('/admin/workspace/'))throw new Error('Sidebar discarded document draft');
    await page.getByRole('button',{name:'Save document',exact:true}).click();
    await page.getByRole('button',{name:'Saved',exact:true}).waitFor();
    await page.reload();await page.locator('[contenteditable="true"]').waitFor();
    if(!(await page.locator('[contenteditable="true"]').innerText()).includes('Browser persistence check.'))throw new Error('Document content did not persist');
    checks.push({name:'Plate save/refresh and sidebar unsaved-change cancellation',passed:true});
    await page.screenshot({path:'docs/reviews/screenshots/workspace-editor.png'});
   }
  }
  if(path==='/admin/plans'){
   const link=page.locator('a[href^="/admin/plans/"]').first();
   if(await link.count()){
    await link.click();await page.locator('.ops-views').waitFor();
    for(const name of ['Grid','List','Calendar','Board']) {await page.locator('.ops-views button').filter({hasText:new RegExp(`^${name}$`,'i')}).click();checks.push({name:`Plans ${name}`,visible:true});}
   }
  }
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/admin');
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 await page.getByRole('link',{name:'Coupons',exact:true}).click();
 await page.getByRole('heading',{name:'Coupon codes'}).waitFor();
 if(await page.getByRole('button',{name:'Create coupon'}).isEnabled())throw new Error('Unconfigured coupon writes enabled');
 checks.push({name:'Mobile navigation and coupon configuration gate',passed:true});
 await page.screenshot({path:'docs/reviews/screenshots/coupons-mobile.png',fullPage:true});
 await page.goto(base+'/');await page.screenshot({path:'docs/reviews/screenshots/homepage-mobile.png',fullPage:true});
 const denied=await context.request.get(base+'/api/admin/coupons');
 if(denied.status()!==401)throw new Error(`Anonymous coupons GET: ${denied.status()}`);
 checks.push({name:'Actual unauthenticated coupon API',status:denied.status()});
 if(errors.length)throw new Error(errors.join('\n'));
} finally {
 writeFileSync('docs/reviews/logs/browser-smoke.json',JSON.stringify({checks,errors},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({checks,errors},null,2));
