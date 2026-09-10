import {chromium} from 'playwright';import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
const errors=[];const checks=[];page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
const routes=['communications','analytics','orders','jobs','jobs/new','bookings','designers','installers','payments','customers','users','products','wall-studio','coupons','artwork','marketing','blog','agent','settings','profile','production-schedule','production','messages','shipments','content','workspace'];
page.setDefaultTimeout(10000);
try{for(const route of routes){try{
 const response=await page.goto('http://127.0.0.1:3000/admin/'+route);
 await page.locator('.ops-sidebar').waitFor();await page.locator('h1').first().waitFor();
 await page.waitForTimeout(400);
 checks.push({route,status:response.status(),headings:await page.locator('h1').allTextContents(),navigation:await page.locator('nav[aria-label="Dashboard navigation"]').count()});
 if(['orders','jobs','jobs/new','workspace','communications','profile'].includes(route))await page.screenshot({path:`docs/reviews/screenshots/dashboard-${route.replaceAll('/','-')}.png`,fullPage:true});
 }catch(error){errors.push({route,message:error.message});}}
 const title=page.locator('.ops-document-card h2').first();
 checks.push({name:'Workspace tracking',letterSpacing:await title.evaluate(e=>getComputedStyle(e).letterSpacing)});
 await page.getByRole('button',{name:'Toggle dashboard theme'}).click();
 await page.screenshot({path:'docs/reviews/screenshots/dashboard-dark.png'});
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:3000/admin/jobs');
 await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('link',{name:'Profile',exact:true}).click();
 await page.waitForURL('**/admin/profile');await page.locator('h1').waitFor();await page.waitForTimeout(400);await page.screenshot({path:'docs/reviews/screenshots/dashboard-profile-mobile.png',fullPage:true});
}finally{fs.writeFileSync('docs/reviews/logs/dashboard-browser.json',JSON.stringify({checks,errors},null,2));await browser.close();}
console.log(JSON.stringify({checks,errors},null,2));if(errors.length||checks.some(c=>c.status&&c.status!==200))process.exitCode=1;
