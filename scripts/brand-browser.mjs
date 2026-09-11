import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];
try {
  for(const path of ['/','/admin','/admin/login']) {
    await page.goto('http://127.0.0.1:3000'+path);
    await page.locator('h1').first().waitFor();
    const logos=page.locator('img[alt="LayeredFX"]');
    await logos.first().waitFor();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('img[alt="LayeredFX"]')).every(i=>i.complete&&i.naturalWidth>0));
    assert.equal(await page.locator('link[rel="icon"][media]').count(),2);
    checks.push({path,logos:await logos.evaluateAll(images=>images.map(i=>({src:i.getAttribute('src'),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})))});
    await page.screenshot({path:`docs/reviews/screenshots/brand-${path.replaceAll('/','')||'home'}.png`});
    if(path==='/admin') {
      await page.getByRole('button',{name:'Toggle dashboard theme'}).click();
      assert.equal(await page.locator('.ops-topbar img').count(),0);
      assert.match(await page.locator('.ops-brand-full').getAttribute('src'),/dark_simple/);
      await page.screenshot({path:'docs/reviews/screenshots/brand-dashboard-dark.png'});
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3000');
  await page.locator('.lfx-logo img').first().waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'docs/reviews/screenshots/brand-mobile.png'});
  const manifest=await (await page.request.get('http://127.0.0.1:3000/manifest.webmanifest')).json();
  assert.equal(manifest.icons[0].src,'/brand/layeredfx_app_icon.svg');
  for(const name of ['LayeredFX_favicon_dark.png','LayeredFX_favicon_light.png','layeredfx_app_icon.svg','LayeredFX_logo_light_outline_email.png','LayeredFX_logo_dark_outline_email.png','layeredfx_logo_dark_outline.svg']) {
    assert.equal((await page.request.get('http://127.0.0.1:3000/brand/'+name)).status(),200);
  }
  assert.deepEqual(errors,[]);
  writeFileSync('docs/reviews/logs/brand-browser.json',JSON.stringify({checks,manifest,errors},null,2));
  console.log('Branding browser checks passed: homepage, dashboard themes, login, mobile, favicons, manifest and email assets.');
} finally {await browser.close();}
