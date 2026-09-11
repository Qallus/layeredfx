import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:3000/admin');
 const nav=page.getByRole('navigation',{name:'Mobile shortcuts'});await nav.waitFor();
 assert.equal(await nav.locator('a,button').count(),10);
 assert.equal(await page.locator('.ops-dock-scroll').evaluate(e=>e.scrollWidth>e.clientWidth),true);
 await page.getByRole('button',{name:'Hide bottom menu'}).click();
 assert.equal(await nav.isVisible(),false);await page.reload();
 await page.getByRole('button',{name:'Show bottom menu'}).click();await nav.waitFor();
 for(const [label,id] of [['Call','dialpad'],['SMS','sms'],['Record','record']]){
  await nav.getByRole('button',{name:label,exact:true}).click();
  await page.locator(`#quick-${id}`).waitFor();
  const panel=await page.locator('.ops-fab-panel').boundingBox(),bar=await nav.boundingBox();
  assert.ok(panel.y>=0&&panel.y+panel.height<=bar.y);
  await page.getByRole('button',{name:'Close quick actions',exact:true}).click();
 }
 await nav.getByRole('button',{name:'Leads',exact:true}).click();
 await page.getByRole('dialog').getByRole('heading',{name:'Leads',exact:true}).waitFor();
 await page.keyboard.press('Escape');
 await nav.getByRole('button',{name:'Digital Business Card',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Name',{exact:true}).fill('Mobile Review');
 await dialog.getByRole('button',{name:'Save card',exact:true}).click();
 const download=page.waitForEvent('download');await dialog.getByRole('button',{name:'Download contact card'}).click();assert.equal((await download).suggestedFilename(),'layeredfx-contact.vcf');
 await page.keyboard.press('Escape');await nav.getByRole('button',{name:'Digital Business Card',exact:true}).click();
 assert.equal(await dialog.getByLabel('Name',{exact:true}).inputValue(),'Mobile Review');await page.keyboard.press('Escape');
 await nav.getByRole('button',{name:'Camera',exact:true}).click();
 assert.equal(await dialog.locator('input[accept="image/*"]').getAttribute('capture'),'environment');
 assert.equal(await dialog.locator('input[accept="video/*"]').getAttribute('capture'),'environment');
 await dialog.locator('input[accept="image/*"]').setInputFiles('public/brand/LayeredFX_favicon_light.png');
 await dialog.getByAltText('Captured photo preview').waitFor();
 await page.screenshot({path:'docs/reviews/screenshots/mobile-menu-camera.png'});await page.keyboard.press('Escape');
 for(const [label,path] of [['Contacts','contacts'],['Pipeline','pipeline'],['Jobs','jobs'],['Dashboard','']]){await nav.getByRole('link',{name:label,exact:true}).click();await page.waitForURL(`**/admin${path?'/'+path:''}`);}
 await page.screenshot({path:'docs/reviews/screenshots/mobile-menu-phone.png'});
 await page.setViewportSize({width:1024,height:768});assert.equal(await nav.isVisible(),true);
 await page.screenshot({path:'docs/reviews/screenshots/mobile-menu-tablet.png'});
 await page.setViewportSize({width:1440,height:1000});assert.equal(await nav.isVisible(),false);
 assert.deepEqual(errors,[]);
 writeFileSync('docs/reviews/logs/mobile-menu-browser.json',JSON.stringify({passed:true,checks:['10 shortcuts','horizontal overflow','hide and restore across reload','call SMS recorder panels','panels clear bottom dock','leads modal','card save reload and vCard download','camera photo video capture attributes','photo preview','all destination links','tablet visible desktop hidden'],errors,limitations:['Actual native phone camera and OS sharing require a physical device check. No live Twilio calls or messages sent.']},null,2));
 console.log('Mobile menu browser checks passed.');
}finally{await browser.close();}
