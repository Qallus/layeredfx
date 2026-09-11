import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const checks=[];
try{
 for(const path of ['/book','/contact']){
  console.log('Checking '+path);
  await page.goto('http://127.0.0.1:3000'+path);
  if(path==='/book'){
   await page.getByRole('button',{name:'Choose a preferred date'}).click();
   await page.getByLabel('Preferred date',{exact:true}).fill('2027-12-10');
   await page.getByRole('button',{name:'Continue',exact:true}).click();
  }
  await page.getByLabel('Name',{exact:true}).fill('Preview Customer');
  await page.getByLabel('Email',{exact:true}).fill('preview@example.test');
  await page.getByLabel('Tell us more').fill('Public request browser verification');
  await page.getByRole('button',{name:'Continue to my account'}).click();
  await page.waitForURL(/\/portal\//);
  await page.getByLabel('Details',{exact:true}).waitFor();
  assert.match(await page.getByLabel('Details',{exact:true}).inputValue(),/Public request browser verification/);
  await page.getByRole('button',{name:'Save preview',exact:true}).click();
  await page.getByText('Saved in this browser.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('lfx:public-draft')),null);
  checks.push({path,draftAndSave:true});
 }
 await page.goto('http://127.0.0.1:3000/contact');
 await page.locator('.lfx-account summary').click();
 assert.equal(await page.getByRole('link',{name:'Login',exact:true}).getAttribute('href'),'/login');
 assert.equal(await page.getByRole('link',{name:'Register',exact:true}).getAttribute('href'),'/register');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Toggle frontend theme'}).click();
 for(const path of ['/','/contact','/book','/login','/register']){
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:3000'+path);
  await page.waitForFunction(()=>document.documentElement.dataset.frontendTheme==='dark');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,path);
  await page.screenshot({path:`docs/reviews/screenshots/frontend-${path==='/'?'home':path.slice(1)}-mobile-dark.png`,fullPage:true});
  checks.push({path,mobileDark:true});
 }
 await page.getByRole('button',{name:'Toggle frontend theme'}).click();
 await page.goto('http://127.0.0.1:3000/contact');
 await page.waitForFunction(()=>document.documentElement.dataset.frontendTheme==='light');
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'docs/reviews/screenshots/frontend-contact-light.png',fullPage:true});
 writeFileSync('docs/reviews/logs/frontend-pages-browser.json',JSON.stringify(checks,null,2));
 console.log('Frontend form handoffs, account links, theme persistence and mobile layouts passed.');
}finally{await browser.close();}
