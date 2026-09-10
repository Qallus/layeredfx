import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
page.setDefaultTimeout(15000);
try{
 await page.goto('http://127.0.0.1:3000/admin/orders');
 await page.getByRole('button',{name:'Create order',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();
 checks.push({name:'Source order creation form',visible:true,headingSpacing:await dialog.locator('h2').evaluate(e=>getComputedStyle(e).letterSpacing)});
 await page.screenshot({path:'docs/reviews/screenshots/dashboard-create-order.png'});
 await page.keyboard.press('Escape');
 for(const route of ['designers','installers']){
  await page.goto('http://127.0.0.1:3000/admin/'+route);
  await page.getByRole('button',{name:route==='designers'?'Add designer':'Add installer',exact:true}).click();
  await page.getByRole('dialog').waitFor();checks.push({name:route+' form',visible:true});await page.keyboard.press('Escape');
 }
 await page.goto('http://127.0.0.1:3000/admin/jobs');
 for(const name of ['List','Table','Card','Kanban','Calendar']){await page.getByRole('button',{name,exact:true}).click();checks.push({name:'CMI Jobs '+name,visible:true});}
 await page.goto('http://127.0.0.1:3000/admin/jobs/new');
 for(const name of ['Clients','Internal Users','Subs / Vendors','Advanced Settings','Insurance / Risk','Job Details']){await page.getByRole('button',{name,exact:true}).click();checks.push({name:'New Job '+name,visible:true});}
 await page.locator('input').first().fill('Local review job');
 await page.getByRole('button',{name:'Save as Draft',exact:true}).click();
 await page.getByText('This action requires the LayeredFX database integration. No changes were saved or sent.',{exact:true}).waitFor();
 checks.push({name:'Job save reports unavailable integration, retains form',passed:await page.locator('input').first().inputValue()==='Local review job'});
 await page.goto('http://127.0.0.1:3000/admin/jobs/map');await page.locator('.leaflet-container').waitFor();
 checks.push({name:'CMI Jobs map mounts',passed:true});
}finally{writeFileSync('docs/reviews/logs/dashboard-interactions.json',JSON.stringify({checks,errors},null,2));await browser.close();}
console.log(JSON.stringify({checks,errors},null,2));if(errors.length)process.exitCode=1;
