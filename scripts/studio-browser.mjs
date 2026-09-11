import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 const response=await page.goto('http://127.0.0.1:3000/studio');assert.equal(response.status(),200);
 const canvas=page.locator('.ws-canvas canvas');await canvas.waitFor();
 await page.waitForFunction(()=>document.querySelector('.ws-canvas canvas').getContext('2d').getImageData(400,400,1,1).data[3]>0);
 const pixel=()=>canvas.evaluate(c=>Array.from(c.getContext('2d').getImageData(Math.round(c.width*.4),Math.round(c.height*.4),1,1).data));
 await page.getByRole('button',{name:'Show original',exact:true}).click();const original=await pixel();
 await page.getByRole('button',{name:'Show design',exact:true}).click();assert.notDeepEqual(await pixel(),original);
 await page.getByRole('button',{name:'Keep objects in front',exact:true}).click();
 const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.42,box.y+box.height*.4);await page.mouse.up();
 assert.deepEqual(await pixel(),original,'Brush must preserve original foreground pixels');
 await page.getByRole('button',{name:/Warm Roman clay/}).click();assert.deepEqual(await pixel(),original,'Changing finish must preserve foreground');
 await page.getByRole('button',{name:'Undo mask'}).click();assert.notDeepEqual(await pixel(),original);
 await page.getByRole('button',{name:'Redo',exact:true}).click();assert.deepEqual(await pixel(),original);
 await page.getByRole('button',{name:'Save this look'}).click();await page.getByRole('status').filter({hasText:'Look saved'}).waitFor();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download preview'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'LayeredFX-wall-preview.png');await download.saveAs('docs/reviews/screenshots/studio-export.png');
 await page.reload();await page.getByRole('button',{name:'Open saved look'}).click();await page.getByRole('status').filter({hasText:'Saved look restored'}).waitFor();await page.waitForTimeout(200);assert.deepEqual(await pixel(),original);
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'docs/reviews/screenshots/studio-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Toggle frontend theme'}).click();await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.screenshot({path:'docs/reviews/screenshots/studio-mobile-dark.png',fullPage:true});
 assert.deepEqual(errors,[]);writeFileSync('docs/reviews/logs/studio-browser.json',JSON.stringify({foregroundPixelsPreserved:true,materialSwitch:true,undoRedo:true,saveRestore:true,pngExport:true,mobileDark:true,errors},null,2));console.log('Wall Studio foreground compositing, undo/redo, persistence, export and mobile checks passed.');
}finally{await browser.close();}
