import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';
const moduleUrl=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const transpile=(path,options={})=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,...options}}).outputText;
const profileUrl=moduleUrl(transpile('../lib/business/profile.ts'));
const {business,businessAddressLine}=await import(profileUrl);
const servicesStub=moduleUrl(`export const servicePages=[{name:'Epoxy',slug:'epoxy'},{name:'Window tint & film',slug:'window-tint-and-film'}];`);
const jsxStub=moduleUrl(`export const jsx=(type,props)=>({type,props});export const jsxs=(type,props)=>({type,props});`);
let jsonLdCode=transpile('../components/layeredfx/business-json-ld.tsx',{jsx:ts.JsxEmit.ReactJSX});
jsonLdCode=jsonLdCode.replaceAll('@/lib/business/profile',profileUrl).replaceAll('@/lib/layeredfx/service-pages',servicesStub).replaceAll('react/jsx-runtime',jsxStub);
const {businessJsonLd,BusinessJsonLd}=await import(moduleUrl(jsonLdCode));

test('business profile holds listing-ready contact details',()=>{
  assert.equal(business.phone.e164,'+16027773303');assert.equal(business.phone.href,'tel:+16027773303');
  assert.equal(business.sms.e164,'+14809999906');assert.equal(business.sms.href,'sms:+14809999906');
  assert.equal(businessAddressLine,'7314 E Osborn Dr Ste A, Scottsdale, AZ 85251');
  assert.ok(business.description.length<=750,'Google allows at most 750 characters');
  assert.doesNotMatch(business.description,/https?:|best|#1|award/i);
});

test('structured data mirrors the business profile, weekday hours and services',()=>{
  const data=businessJsonLd('https://layeredfx.com');
  assert.equal(data['@type'],'HomeAndConstructionBusiness');
  assert.equal(data.telephone,business.phone.e164);
  assert.equal(data.address.streetAddress,business.address.street);assert.equal(data.address.postalCode,'85251');
  assert.ok(data.areaServed.some(area=>area.name==='Scottsdale, AZ'));
  assert.deepEqual(data.openingHoursSpecification[0].dayOfWeek,['Monday','Tuesday','Wednesday','Thursday','Friday']);
  assert.equal(JSON.stringify(data).includes('Saturday'),false,'Saturday is appointment-only, not regular hours');
  assert.deepEqual(data.hasOfferCatalog.itemListElement.map(offer=>offer.itemOffered.url),['https://layeredfx.com/services/epoxy','https://layeredfx.com/services/window-tint-and-film']);
  const script=BusinessJsonLd();
  assert.equal(script.props.type,'application/ld+json');
  assert.equal(script.props.dangerouslySetInnerHTML.__html.includes('<'),false);
});

test('public pages only show phone numbers from the business profile',()=>{
  const allowed=new Set([business.phone.display,business.sms.display,business.phone.e164,business.sms.e164]);
  for(const file of ['../components/layeredfx/footer.tsx','../components/layeredfx/contact-page.tsx','../components/layeredfx/support-fab.tsx','../app/privacy/page.tsx','../app/terms/page.tsx','../app/opt-in/page.tsx','../app/opt-out/page.tsx']){
    const source=readFileSync(new URL(file,import.meta.url),'utf8');
    for(const match of source.match(/\(\d{3}\) \d{3}-\d{4}|\+1\d{10}/g)||[])assert.ok(allowed.has(match),`${file} shows ${match}, which is not in lib/business/profile.ts`);
  }
});
