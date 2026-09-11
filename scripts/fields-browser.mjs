import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:3000/admin/pipeline');await page.getByRole('heading',{name:'Pipeline',exact:true}).waitFor();
 const filters=page.locator('.ops-pipeline-filters');assert.equal(await filters.count(),1);
 await page.getByRole('combobox',{name:'Filter owner'}).click();await page.getByRole('option',{name:'Demo Installer',exact:true}).click();
 assert.match(await page.getByRole('combobox',{name:'Filter owner'}).innerText(),/Demo Installer/);
 await page.getByRole('combobox',{name:'Filter owner'}).click();await page.getByRole('option',{name:'All owners',exact:true}).click();
 await page.screenshot({path:'docs/reviews/screenshots/fields-pipeline-light.png'});
 await page.getByRole('button',{name:'Toggle dashboard theme'}).click();
 await page.getByRole('combobox',{name:'Filter owner'}).click();
 assert.equal(await page.getByRole('listbox').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(24, 36, 26)');
 await page.screenshot({path:'docs/reviews/screenshots/fields-dropdown-dark.png'});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'New opportunity',exact:true}).click();
 await page.getByRole('button',{name:'Choose date',exact:true}).click();
 const picker=page.locator('.ops-date-picker');await picker.waitFor();
 const day=picker.locator('.ops-picker-grid button').first();const selected=await day.getAttribute('aria-label');await day.click();await picker.getByRole('button',{name:'Done',exact:true}).click();
 assert.equal(await page.getByLabel('Expected close date',{exact:true}).inputValue(),selected);
 await page.getByLabel('Expected close date',{exact:true}).fill('2026-99-45');assert.equal(await page.getByLabel('Expected close date',{exact:true}).evaluate(e=>e.checkValidity()),false);
 await page.screenshot({path:'docs/reviews/screenshots/fields-form-dark.png'});
 await page.keyboard.press('Escape');
 const fab=page.getByRole('button',{name:'Quick actions',exact:true});assert.equal(await fab.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(32, 43, 40)');assert.equal(await fab.locator('svg.lucide-plus').count(),0);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'docs/reviews/screenshots/fields-mobile.png'});
 for(const route of ['contacts','workspace','plans','bookings','jobs']){await page.goto(`http://127.0.0.1:3000/admin/${route}`);await page.locator('h1').first().waitFor();}
 assert.deepEqual(errors,[]);writeFileSync('docs/reviews/logs/fields-browser.json',JSON.stringify({passed:true,checks:['owner filter custom options','dark dropdown colors','custom calendar selection','invalid date rejection','FAB colors and icon','mobile overflow','contacts workspace plans bookings jobs render'],errors},null,2));console.log('Branded field browser checks passed.');
}finally{await browser.close();}
