import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:3808,height:1894},reducedMotion:'reduce'});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
async function check(path,collapsed){
 const brand=page.locator('.ops-brand');
 assert.equal(await brand.locator('img:visible').count(),1);
 assert.equal(await page.locator('.ops-topbar img').count(),0);
 assert.equal(await brand.locator(collapsed?'.ops-brand-icon':'.ops-brand-full').isVisible(),true);
 const dims=await page.evaluate(()=>{const app=document.querySelector('.ops-app').getBoundingClientRect(),main=document.querySelector('.ops-main').getBoundingClientRect(),content=document.querySelector('.source-screen')?.getBoundingClientRect();return{app:app.width,main:main.width,left:content?content.left-app.left:null,right:content?app.right-content.right:null};});
 assert.equal(dims.app,dims.main);
 if(dims.left!==null){assert.ok(dims.left<=28);assert.ok(dims.right<=28);}
 checks.push({path,collapsed,...dims});
}
try{
 for(const path of ['customers','messages','']){
  await page.goto('http://127.0.0.1:3000/admin'+(path?'/'+path:''));await page.locator('h1').first().waitFor();
  await check(path,false);
  await page.getByRole('button',{name:'Collapse sidebar',exact:true}).click();await check(path,true);
  await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
  await page.screenshot({path:`docs/reviews/screenshots/layout-${path||'dashboard'}-wide.png`});
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();
 assert.equal(await page.locator('.ops-brand img:visible').count(),1);
 await page.screenshot({path:'docs/reviews/screenshots/layout-mobile.png'});
 await page.getByRole('button',{name:'Close navigation',exact:true}).first().click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto('http://127.0.0.1:3000/');await page.locator('.lfx-logo img').first().waitFor();
 assert.equal(await page.locator('.lfx-logo img').first().isVisible(),true);
 assert.deepEqual(errors,[]);writeFileSync('docs/reviews/logs/layout-browser.json',JSON.stringify({checks,errors,mobile:true,homepage:true},null,2));
 console.log('Layout checks passed: single sidebar logo, no top-bar logo, full content width, mobile and homepage.');
}finally{await browser.close();}
