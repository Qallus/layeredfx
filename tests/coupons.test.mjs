import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Execute the actual TypeScript validation module on the supported Node 22 baseline.
const js=ts.transpileModule(readFileSync(new URL('../lib/admin/coupons.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {couponFields,couponRevision,requireCouponWriter}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const valid={code:'summer',discount_type:'percentage',discount_value:20,active:true};
test('coupon codes are canonical and fields are allowlisted',()=>{
 const coupon=couponFields({...valid,org_id:'other-business',uses_count:100,changed_by:'someone'});
 assert.equal(coupon.code,'SUMMER');assert.equal(coupon.uses_count,undefined);assert.equal(coupon.org_id,undefined);assert.equal(coupon.changed_by,undefined);
});
test('percentage cap applies to partial edits as well as creation',()=>{
 const existing={...couponFields(valid),id:'1',revision:0,uses_count:0,created_at:''};
 assert.throws(()=>couponFields({discount_value:101},existing),/out of range/);
 assert.throws(()=>couponFields({...existing,discount_type:'percentage',discount_value:101}),/out of range/);
 const fixed={...existing,discount_type:'fixed',discount_value:500};
 assert.throws(()=>couponFields({discount_type:'percentage'},fixed),/out of range/);
});
test('coupon numbers reject NaN, infinity, negatives, booleans and fractional uses',()=>{
 for(const value of [NaN,Infinity,-1,true,'',null,0,0.001]) assert.throws(()=>couponFields({...valid,discount_value:value}));
 for(const value of [0,-1,1.5,Infinity]) assert.throws(()=>couponFields({...valid,max_uses:value}));
 assert.throws(()=>couponFields({...valid,min_order_total:-1}));
});
test('existing coupon code is immutable',()=>{
 assert.throws(()=>couponFields({code:'DIFFERENT'},{...couponFields(valid),id:'1',revision:0,uses_count:0,created_at:''}),/cannot be changed/);
});
test('optional restrictions can be cleared and descriptions can be emptied',()=>{
 const result=couponFields({description:'',expires_at:null,min_order_total:null,max_uses:null},{...couponFields({...valid,description:'old',max_uses:2}),id:'1',revision:0,uses_count:0,created_at:''});
 assert.equal(result.description,null);assert.equal(result.max_uses,null);
});
test('coupon expiry and status are validated',()=>{
 assert.throws(()=>couponFields({...valid,expires_at:'not a date'}));
 assert.throws(()=>couponFields({...valid,active:'true'}));
 assert.equal(couponFields({...valid,expires_at:'2026-10-01T23:59:59-07:00'}).expires_at,'2026-10-02T06:59:59.000Z');
});
test('viewer and unrecognized roles cannot mutate coupons',()=>{
 for(const role of ['viewer','customer','','super_admin']) assert.throws(()=>requireCouponWriter(role),{status:403});
 for(const role of ['admin','staff']) assert.doesNotThrow(()=>requireCouponWriter(role));
});
test('coupon mutations require an integer revision',()=>{
 for(const revision of [undefined,-1,0.5,'1',NaN,Infinity]) assert.throws(()=>couponRevision({revision}));
 assert.equal(couponRevision({revision:0}),0);
});
