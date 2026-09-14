import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:1500,height:1000}});
try{
await p.goto('http://127.0.0.1:3000/studio');
assert.equal(await p.locator('.ws-sample img').first().getAttribute('src'),'/studio/room-residential-v2.png');
await p.getByRole('button',{name:'Continue',exact:true}).click();
await p.getByRole('button',{name:'No objects to keep - skip this step',exact:true}).click();
await p.getByRole('button',{name:'Wall marked - choose material',exact:true}).click();
await p.getByLabel('Design name or SKU').fill('Ivory Terrene');
await p.locator('.ws-material-card').filter({hasText:'Ivory Terrene'}).first().click();
await p.getByRole('button',{name:'Apply Material',exact:true}).click();
const slider=p.getByRole('slider',{name:'Pattern Scale',exact:true});await slider.focus();await p.keyboard.press('ArrowRight');assert.equal(await slider.getAttribute('aria-valuenow'),'151');
assert.equal(await p.locator('.ws-properties').getByRole('slider',{name:'Pattern Scale'}).count(),0);
await p.screenshot({path:'docs/reviews/screenshots/studio-material-controls-desktop.png'});
await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Collapse properties'}).click();await p.waitForTimeout(400);
const controls=await p.locator('.ws-material-controls').boundingBox();const drawer=await p.locator('.ws-properties').boundingBox();assert.ok(controls.y+controls.height<=drawer.y+1);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.screenshot({path:'docs/reviews/screenshots/studio-material-controls-mobile.png'});
await p.goto('http://127.0.0.1:3000');assert.match(await p.locator('h1').innerText(),/Same space/);console.log('PASS: updated sample paths, keyboard slider, central controls, mobile visibility and homepage');
}finally{await b.close();}
