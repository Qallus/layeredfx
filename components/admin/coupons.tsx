"use client";
// CTRL+P coupon management adapted to the shared LayeredFX shell and cookie session.
import {useCallback, useEffect, useState} from 'react';
import {type Coupon, type CouponFields} from '@/lib/admin/coupons';
import {useOperations} from '@/components/operations/provider';
import {useUnsavedChanges} from '@/components/operations/use-unsaved-changes';
import {Button, Field, Modal, PageTitle, Panel} from '@/components/operations/shared';

async function request(method = 'GET', body?:unknown, offset = 0) {
  const response = await fetch(`/api/admin/coupons?offset=${offset}`, {method, cache:'no-store', headers:{'Content-Type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'The coupon request failed.');
  return data as {coupons:Coupon[]; nextOffset:number|null};
}
const blank: CouponFields = {code:'',description:'',discount_type:'percentage',discount_value:10,min_order_total:null,max_uses:null,expires_at:null,active:true};
export function AdminCoupons() {
  const {actor,mode} = useOperations();
  const [coupons,setCoupons] = useState<Coupon[]>([]);
  const [editing,setEditing] = useState<Coupon|null|undefined>(undefined);
  const [draft,setDraft] = useState<CouponFields>(blank);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [loaded,setLoaded] = useState(false);
  const [nextOffset,setNextOffset] = useState<number|null>(null);
  const writable = mode === 'supabase' && actor.role !== 'viewer';
  const load = useCallback(async(offset = 0) => {
    setBusy(true); setError('');
    try { const data = await request('GET',undefined,offset); setCoupons(previous=>offset ? [...previous,...data.coupons] : data.coupons); setNextOffset(data.nextOffset); setLoaded(true); }
    catch(e) { setError(e instanceof Error ? e.message : 'Loading failed.'); }
    finally { setBusy(false); }
  },[]);
  useEffect(()=>{if(mode==='supabase') void load();},[mode,load]);
  useUnsavedChanges(editing!==undefined);
  function close() { if (!busy && confirm('Discard this unsaved coupon form?')) setEditing(undefined); }
  function edit(coupon:Coupon|null) {setError('');setEditing(coupon);setDraft(coupon ? {...coupon} : {...blank});}
  async function mutate(method:string, body:unknown) {
    setBusy(true);setError('');setNotice('');
    try {await request(method,body);setEditing(undefined);setNotice('Coupon saved.');await load();}
    catch(e) {setError(e instanceof Error ? e.message : 'The change was not saved.');}
    finally {setBusy(false);}
  }
  return <>
    <PageTitle title="Coupon codes" description="Manage discounts for customers and manual orders.">
      <Button disabled={!writable||busy||!loaded} onClick={()=>edit(null)}>Create coupon</Button>
    </PageTitle>
    {mode==='demo' ? <Panel title="LayeredFX connection required"><p>Coupon management uses the isolated LayeredFX database. Sign in to a configured LayeredFX environment to manage coupons.</p></Panel> : <>
      {error&&<p role="alert" className="ops-error">{error}</p>}
      {notice&&<p role="status">{notice}</p>}
      <Button variant="outline" disabled={busy} onClick={()=>void load()}>Reload coupons</Button>
      <Panel title="Coupons">
        {busy&&<p role="status">Loading or saving coupons…</p>}
        {!busy&&loaded&&!coupons.length&&<p>No coupons yet.</p>}
        <div style={{overflowX:'auto'}}><table className="ops-table"><thead><tr><th>Code</th><th>Discount</th><th>Restrictions</th><th>Uses</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {coupons.map(c=><tr key={c.id}><td><b>{c.code}</b><p>{c.description}</p></td><td>{c.discount_type==='percentage' ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}</td><td>{c.min_order_total===null ? 'No minimum' : `Minimum $${Number(c.min_order_total).toFixed(2)}`}</td><td>{c.uses_count}{c.max_uses!==null&&` / ${c.max_uses}`}</td><td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-US',{timeZone:'America/Phoenix'}) : 'No expiry'}</td><td>{!c.active?'Inactive':c.expires_at&&Date.parse(c.expires_at)<Date.now()?'Expired':c.max_uses!==null&&c.uses_count>=c.max_uses?'Exhausted':'Active'}</td><td>
            <Button size="sm" disabled={!writable||busy} onClick={()=>edit(c)}>Edit {c.code}</Button>
            <Button size="sm" variant="outline" disabled={!writable||busy} onClick={()=>void mutate('PATCH',{id:c.id,revision:c.revision,active:!c.active})}>{c.active?'Deactivate':'Activate'}</Button>
            <Button size="sm" variant="outline" disabled={!writable||busy||c.uses_count>0} onClick={()=>{if(confirm(`Delete unused coupon ${c.code}?`)) void mutate('DELETE',{id:c.id,revision:c.revision});}}>Delete</Button>
          </td></tr>)}
        </tbody></table></div>
        {nextOffset!==null&&<Button disabled={busy} onClick={()=>void load(nextOffset)}>Load more</Button>}
      </Panel>
    </>}
    <Modal open={editing!==undefined} onClose={close} title={editing ? `Edit ${editing.code}` : 'Create coupon'} description="Changes are saved to the isolated LayeredFX database.">
      <form onSubmit={e=>{e.preventDefault();void mutate(editing?'PATCH':'POST',{...draft,...(editing ? {id:editing.id,revision:editing.revision} : {})});}}>
        {error&&<p role="alert" className="ops-error">{error}</p>}
        <fieldset disabled={busy} style={{border:0,padding:0}}>
          <Field label="Code"><input required maxLength={64} pattern="[A-Za-z0-9_-]+" disabled={Boolean(editing)} value={draft.code} onChange={e=>setDraft({...draft,code:e.target.value.toUpperCase()})}/></Field>
          <Field label="Description"><input maxLength={2000} value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})}/></Field>
          <Field label="Discount type"><select value={draft.discount_type} onChange={e=>setDraft({...draft,discount_type:e.target.value as 'fixed'|'percentage'})}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></Field>
          <Field label="Discount value"><input required type="number" min="0.01" max={draft.discount_type==='percentage'?100:99999999.99} step="0.01" value={draft.discount_value} onChange={e=>setDraft({...draft,discount_value:Number(e.target.value)})}/></Field>
          <Field label="Minimum order amount"><input type="number" min="0" step="0.01" value={draft.min_order_total??''} onChange={e=>setDraft({...draft,min_order_total:e.target.value===''?null:Number(e.target.value)})}/></Field>
          <Field label="Maximum uses"><input type="number" min="1" step="1" value={draft.max_uses??''} onChange={e=>setDraft({...draft,max_uses:e.target.value===''?null:Number(e.target.value)})}/></Field>
          <Field label="Expiry date (end of day, Arizona)"><input type="date" value={draft.expires_at ? new Date(Date.parse(draft.expires_at)-7*3600000).toISOString().slice(0,10) : ''} onChange={e=>setDraft({...draft,expires_at:e.target.value?new Date(`${e.target.value}T23:59:59-07:00`).toISOString():null})}/></Field>
          <Field label="Status"><select value={String(draft.active)} onChange={e=>setDraft({...draft,active:e.target.value==='true'})}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
          <Button type="submit">{busy?'Saving…':'Save coupon'}</Button> <Button type="button" variant="outline" onClick={close}>Cancel</Button>
        </fieldset>
      </form>
    </Modal>
  </>;
}
