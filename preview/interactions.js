(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const e = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const ic = name => LFX_ICONS[name] || '';
  const button = (text, action, variant='primary', icon='right') => `<button type="button" class="lfx-button lfx-button-${variant} lfx-button-default" data-action="${action}">${text}${ic(icon)}</button>`;
  window.lfxState = {finish:'clay',paused:window.matchMedia('(prefers-reduced-motion: reduce)').matches};
  let state={step:0,kind:'Residential',services:[],finish:null,contact:{name:'',email:'',city:'',notes:''},photos:[],errors:{},done:false};
  let opener=null;
  const detail=$('#detailDialog'), estimate=$('#estimateDialog'), menu=$('#mobileMenu');
  function show(dialog){opener=document.activeElement;dialog.showModal();}
  [detail,estimate,menu].forEach(dialog=>{
    dialog.addEventListener('close',()=>{opener?.focus?.();if(dialog===estimate){state.photos.forEach(photo=>URL.revokeObjectURL(photo.url));state.photos=[];}});
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  });
  function startEstimate(service=null,finish=null){
    state.photos.forEach(photo=>URL.revokeObjectURL(photo.url));
    state={step:0,kind:'Residential',services:service?[service]:[],finish,contact:{name:'',email:'',city:'',notes:''},photos:[],errors:{},done:false};
    if(detail.open)detail.close();renderEstimate();show(estimate);
  }
  function renderEstimate(){
    const title=state.done?'Your ideas, all in one place.':'Let’s start with your space.';
    let body=`<div class="lfx-eyebrow">Your space / A new possibility</div><h2 id="estimateTitle" class="lfx-dialog-title">${title}</h2><p id="estimateDescription" class="lfx-dialog-description">This is an interactive estimate preview. Nothing is sent, uploaded, booked, or stored on a server.</p>`;
    if(state.done){
      body+=`<div class="lfx-preview-complete">${ic('check')}<h3>Preview complete. No request was sent.</h3><p>Your selections are ready to review. You can export a local sample brief or close this window. A live estimate workflow will be connected in a later phase.</p><div class="lfx-dialog-actions">${button('Export sample brief','export','outline','download')}${button('Done','close','primary','check')}</div></div>`;
      $('#estimateBody').innerHTML=body;return;
    }
    body+=`<div class="lfx-form-steps" aria-label="Step ${state.step+1} of 3">${['Your project','The details','Review'].map((s,i)=>`<span class="${i<=state.step?'is-active':''}"><i>${i<state.step?ic('check'):i+1}</i>${s}</span>`).join('')}</div>`;
    if(state.step===0){
      body+=`<div class="lfx-form-step"><fieldset><legend>What kind of space?</legend><div class="lfx-kind-options">${['Residential','Commercial'].map(s=>`<label class="${s===state.kind?'is-active':''}"><input type="radio" name="project-kind" value="${s}" ${s===state.kind?'checked':''}>${s}</label>`).join('')}</div></fieldset><fieldset><legend>What would you like to transform? <span>Select any that apply.</span></legend><div class="lfx-service-options">${LFX_DATA.services.map(s=>`<label class="${state.services.includes(s)?'is-active':''}"><input type="checkbox" name="service-choice" value="${e(s)}" ${state.services.includes(s)?'checked':''}><span>${s}</span></label>`).join('')}</div></fieldset>${state.finish?`<p class="lfx-finish-summary">Your finish inspiration: <strong>${e(state.finish)}</strong></p>`:''}</div>`;
    } else if(state.step===1) {
      const field=(name,label,type='text',optional=false)=>`<label>${label}${optional?'<span class="lfx-optional">Optional</span>':''}<input class="lfx-input" type="${type}" aria-label="${label}" name="${name}" value="${e(state.contact[name])}" autocomplete="${({name:'name',email:'email',city:'address-level2'})[name]}" aria-invalid="${!!state.errors[name]}" ${state.errors[name]?`aria-describedby="${name}-error"`:''}>${state.errors[name]?`<small id="${name}-error" class="lfx-error">${state.errors[name]}</small>`:''}</label>`;
      body+=`<div class="lfx-form-step"><div class="lfx-field-grid">${field('name','Your name')}${field('email','Email address','email')}</div>${field('city','Project city','text',true)}<label>Tell us a little about your ideas<textarea class="lfx-input" name="notes" rows="3" placeholder="The surfaces, the feeling, the possibilities…">${e(state.contact.notes)}</textarea></label><label class="lfx-upload">${ic('image')}<span>Add a few photos<small>JPG, PNG, or WebP · 8 MB each · Up to 4</small></span><input id="previewPhotos" type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Add project photos"></label>${state.errors.photos?`<p class="lfx-error" role="alert">${e(state.errors.photos)}</p>`:''}<div class="lfx-photo-previews">${state.photos.map((p,i)=>`<div><div class="lfx-photo-thumb" style="background-image:url('${p.url}')"></div><span>${e(p.file.name)}</span><button data-remove-photo="${i}" aria-label="Remove ${e(p.file.name)}">${ic('close')}</button></div>`).join('')}</div><p class="lfx-small-note">Photos remain in browser memory only. Use sample details when testing.</p></div>`;
    } else {
      const rows=[['Space',state.kind],['Services',state.services.join(', ')],...(state.finish?[['Finish inspiration',state.finish]]:[]),['Name',state.contact.name],['Email',state.contact.email],...(state.contact.city?[['City',state.contact.city]]:[]),['Photos selected locally',state.photos.length]];
      body+=`<div class="lfx-form-step lfx-review"><h3>A little closer to your next chapter.</h3><dl>${rows.map(([k,v])=>`<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl><p class="lfx-preview-note">Preview only. Completing this demonstration does not request an estimate or contact LayeredFX.</p></div>`;
    }
    body+=`<div class="lfx-dialog-actions">${button(state.step?'Back':'Cancel','back','ghost','left')}${state.step<2?`<button data-action="next" type="button" class="lfx-button lfx-button-primary lfx-button-default" ${state.step===0&&!state.services.length?'disabled':''}>Continue ${ic('right')}</button>`:button('Finish preview','finish','primary','check')}</div>`;
    $('#estimateBody').innerHTML=body;
  }
  function setFinish(id){
    const finish=LFX_DATA.finishes.find(item=>item.id===id);if(!finish)return;
    window.lfxState.finish=id;
    $$('[data-finish]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.finish===id)));
    $('#selectedFinish').textContent=finish.name;$('#finishDescription').textContent=finish.description;$('#artFinish').textContent=finish.name;
    $('#frontPanel').className='lfx-fallback-panel lfx-fallback-front lfx-swatch-'+id;
    $('#threeHost').setAttribute('aria-label','Illustrative three-dimensional material samples: '+finish.name);
    window.lfxSceneFinish?.(id);
  }
  function setPause(){
    const paused=window.lfxState.paused;
    $('#pauseScene').innerHTML=ic(paused?'play':'pause');$('#pauseScene').setAttribute('aria-label',paused?'Play material animation':'Pause material animation');$('#pauseScene').setAttribute('aria-pressed',String(paused));
    $('#sceneFallback').classList.toggle('lfx-scene-paused',paused);window.lfxScenePause?.();
  }
  setPause();
  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a');if(!target)return;
    if(target.hasAttribute('data-close')){target.closest('dialog').close();return;}
    if(target.hasAttribute('data-estimate')){startEstimate();return;}
    if(target.hasAttribute('data-estimate-service')){startEstimate(target.dataset.estimateService);return;}
    if(target.id==='openMenu'){show(menu);return;}
    if(target.hasAttribute('data-menu-link')){menu.close();return;}
    if(target.hasAttribute('data-filter-service')){
      const value=target.dataset.filterService;$$('[data-filter-service]').forEach(el=>el.setAttribute('aria-pressed',String(el===target)));$$('[data-service-category]').forEach(el=>el.hidden=value!=='all'&&el.dataset.serviceCategory!==value);return;
    }
    if(target.hasAttribute('data-filter-inspiration')){
      const value=target.dataset.filterInspiration;$$('[data-filter-inspiration]').forEach(el=>el.setAttribute('aria-pressed',String(el===target)));$$('[data-inspiration-category]').forEach(el=>el.hidden=value!=='all'&&el.dataset.inspirationCategory!==value);return;
    }
    if(target.hasAttribute('data-service')){
      const group=LFX_DATA.serviceGroups.find(g=>g.id===target.dataset.service);
      $('#detailBody').innerHTML=`<div class="lfx-eyebrow">LayeredFX / Our services</div><h2 id="detailTitle" class="lfx-dialog-title">${e(group.title)}</h2><p class="lfx-dialog-description" id="detailDescription">${e(group.detail)}</p><ul class="lfx-service-dialog-list">${group.services.map(s=>`<li>${ic('check')}${e(s)}</li>`).join('')}</ul><p class="lfx-preview-note">Homepage preview. A project consultation will confirm material suitability, scope, and pricing.</p><button data-estimate-service="${e(group.services[0])}" class="lfx-button lfx-button-primary lfx-button-default">Explore an estimate ${ic('arrow')}</button>`;show(detail);return;
    }
    if(target.hasAttribute('data-inspiration')){
      const item=LFX_DATA.inspiration[Number(target.dataset.inspiration)];
      $('#detailBody').innerHTML=`<div class="lfx-eyebrow">Illustrative design concept</div><h2 id="detailTitle" class="lfx-dialog-title">${e(item.title)}</h2><p id="detailDescription" class="lfx-dialog-description">${e(item.description)}. Consider ${e(item.services.join(' and ').toLowerCase())} as a starting point for a conversation about your own space. This is sample inspiration, not a completed project.</p><div class="lfx-dialog-art"><img src="${LFX_ASSETS[item.image.split('/').pop()]}" alt="${e(item.title)} concept" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>`;show(detail);return;
    }
    if(target.hasAttribute('data-finish')){setFinish(target.dataset.finish);return;}
    if(target.id==='finishEstimate'){
      const f=LFX_DATA.finishes.find(f=>f.id===window.lfxState.finish);startEstimate(({clay:'Roman clay',oak:'Cabinet wraps',stone:'Countertop wraps',charcoal:'Interior painting'})[f.id],f.name);return;
    }
    if(target.id==='pauseScene'){window.lfxState.paused=!window.lfxState.paused;setPause();return;}
    if(target.hasAttribute('data-remove-photo')){const index=Number(target.dataset.removePhoto);URL.revokeObjectURL(state.photos[index].url);state.photos.splice(index,1);renderEstimate();return;}
    if(target.hasAttribute('data-action')){
      const action=target.dataset.action;
      if(action==='back'){if(state.step){state.step--;state.errors={};renderEstimate();}else estimate.close();}
      if(action==='next'){
        if(state.step===0&&!state.services.length)return;
        if(state.step===1){state.errors={};if(!state.contact.name.trim())state.errors.name='Enter your name.';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email.trim()))state.errors.email='Enter a valid email address.';if(Object.keys(state.errors).length){renderEstimate();$('#estimateBody [aria-invalid="true"]')?.focus();return;}}
        state.step++;renderEstimate();$('#estimateBody input, #estimateBody button')?.focus();
      }
      if(action==='finish'){state.done=true;renderEstimate();}
      if(action==='close')estimate.close();
      if(action==='export'){
        const brief={mode:'PREVIEW ONLY — NOT SUBMITTED',projectType:state.kind,services:state.services,finishInspiration:state.finish,...state.contact,photoNames:state.photos.map(p=>p.file.name),note:'Photo bytes are not included. No data was submitted to LayeredFX.'};const url=URL.createObjectURL(new Blob([JSON.stringify(brief,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='layeredfx-preview-brief.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    }
  });
  document.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='project-kind'){state.kind=input.value;renderEstimate();}
    if(input.name==='service-choice'){state.services=input.checked?[...state.services,input.value]:state.services.filter(s=>s!==input.value);input.closest('label').classList.toggle('is-active',input.checked);$('#estimateBody [data-action="next"]').disabled=!state.services.length;}
    if(input.id==='previewPhotos'){
      const files=Array.from(input.files||[]);let error=null;
      if(state.photos.length+files.length>4)error='Choose up to four photos.';
      else for(const f of files){if(!['image/jpeg','image/png','image/webp'].includes(f.type)){error='Choose JPG, PNG, or WebP photos.';break;}if(f.size>8*1024*1024){error='Each photo must be 8 MB or smaller.';break;}}
      state.errors.photos=error;if(!error)state.photos.push(...files.map(file=>({file,url:URL.createObjectURL(file)})));renderEstimate();
    }
  });
  document.addEventListener('input',event=>{
    const input=event.target;
    if(input.id==='compareRange'){const value=Number(input.value);$('#compareBefore').style.clipPath=`inset(0 ${100-value}% 0 0)`;$('#compareLine').style.left=value+'%';}
    if(estimate.contains(input)&&['name','email','city','notes'].includes(input.name))state.contact[input.name]=input.value;
  });
})();
