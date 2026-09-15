import test from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';
const moduleUrl=source=>`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const code=ts.transpileModule(readFileSync(new URL('../lib/profiles/public.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {publicProfiles,PARTNER_GROUPS}=await import(moduleUrl(code));
const member=overrides=>({id:overrides.name,status:'active',visibility:'public',group:'team',sortOrder:1,createdAt:'',updatedAt:'',email:'person@example.com',phone:'+14805550100',showContact:false,department:'Internal ops',availability:'Mon–Fri',secondaryPhotoUrl:'https://example.com/second.jpg',...overrides});

test('only active profiles switched to public are published, grouped and ordered',()=>{
  const groups=publicProfiles({team:[member({name:'Zed',group:'vendor'}),member({name:'Ana',sortOrder:2}),member({name:'Ben',sortOrder:1}),member({name:'Hidden',visibility:'dashboard'}),member({name:'Gone',status:'inactive'}),member({name:'Legacy',visibility:undefined}),member({name:'Odd',group:'celebrity'})]});
  assert.deepEqual(groups.map(g=>g.group),['team','vendor']);
  assert.deepEqual(groups[0].profiles.map(p=>p.name),['Ben','Ana']);
  assert.equal(groups[1].plural,'Vendors');
  assert.deepEqual(PARTNER_GROUPS,['installer','designer','contractor','vendor']);
});

test('email, phone and internal fields stay private unless contact details are allowed',()=>{
  const [{profiles:[hidden]}]=publicProfiles({team:[member({name:'Ana'})]});
  assert.equal(hidden.email,'');assert.equal(hidden.phone,'');
  for(const field of ['department','availability','secondaryPhotoUrl','sortOrder','status','visibility','showContact'])assert.equal(field in hidden,false,field);
  const [{profiles:[shown]}]=publicProfiles({team:[member({name:'Ana',showContact:'true'})]});
  assert.equal(shown.email,'',"only a real boolean opts in");
  const [{profiles:[allowed]}]=publicProfiles({team:[member({name:'Ana',showContact:true})]});
  assert.equal(allowed.email,'person@example.com');assert.equal(allowed.phone,'+14805550100');
});

test('unsafe links are dropped and an empty store publishes nothing',()=>{
  const [{profiles:[p]}]=publicProfiles({team:[member({name:'Ana',photoUrl:'http://example.com/a.jpg',website:'javascript:alert(1)'})]});
  assert.equal(p.photoUrl,'');assert.equal(p.website,'');
  assert.deepEqual(publicProfiles({}),[]);
  assert.deepEqual(publicProfiles({team:[member({name:'Ana',visibility:'dashboard'})]}),[]);
});
