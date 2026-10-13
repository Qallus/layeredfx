"use client";
// Job Daily Logs: rich-text notes, voice notes with on-device transcription, and photos, each attached to a chosen job.
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Camera,ImagePlus,Mic,NotebookPen,Pencil,Square,Trash2,Upload,X} from 'lucide-react';
import {today} from '@/lib/operations/engine.mjs';
import {baseMime,canChange,extensionFor,LOG_KIND_LABELS,LOG_LIMITS,type JobLog,type LogKind} from '@/lib/jobs/logs-model';
import {compressPhoto} from '@/lib/jobs/compress';
import {transcribeOnDevice} from '@/lib/jobs/transcribe';
import {liveFetch,useOperations} from './provider';
import {BrandedInput,BrandedSelect} from './branded-fields';
import {Button,dateLabel,Empty,Field,Modal,PageTitle,Panel,Views} from './shared';
const Editor=dynamic(()=>import('./document-editor').then(m=>m.DocumentEditor),{ssr:false,loading:()=> <p className="ops-muted">Loading editor…</p>});
const blankNote=()=>[{type:'p',children:[{text:''}]}];
const mediaUrl=(log:JobLog,id:string)=>`/api/jobs/logs/media?log=${encodeURIComponent(log.id)}&media=${encodeURIComponent(id)}`;
const MAX_SECONDS=600;
async function failure(res:Response){try{return (await res.json()).message||'The request failed.';}catch{return 'The request failed.';}}
export const LOG_TYPES:{kind:LogKind;label:string;detail:string;Icon:typeof Mic}[]=[
 {kind:'note',label:'Notes',detail:'Write a formatted daily note.',Icon:NotebookPen},
 {kind:'voice',label:'Voice Recorder',detail:'Record, then transcribe on this device.',Icon:Mic},
 {kind:'photo',label:'Photos',detail:'Take or choose job photos.',Icon:Camera},
];

export function useJobLogs(jobId?:string){
 const [logs,setLogs]=useState<JobLog[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const reload=useCallback(async()=>{setLoading(true);try{const res=await liveFetch(`/api/jobs/logs${jobId?`?job=${encodeURIComponent(jobId)}`:''}`,{cache:'no-store'});if(!res.ok)throw new Error(await failure(res));setLogs((await res.json()).logs);setError('');}catch(e){setError(e instanceof Error?e.message:'Could not load daily logs.');}finally{setLoading(false);}},[jobId]);
 useEffect(()=>{void reload();},[reload]);
 return {logs,loading,error,reload,setLogs};
}

export function LogTypeChooser({onPick}:{onPick:(kind:LogKind)=>void}){
 return <div className="ops-log-types">{LOG_TYPES.map(({kind,label,detail,Icon})=><button key={kind} type="button" onClick={()=>onPick(kind)}><Icon size={24}/><b>{label}</b><small>{detail}</small></button>)}</div>;
}

export function JobSelect({value,onChange}:{value:string;onChange:(id:string)=>void}){
 const {state}=useOperations();const jobs=(state.jobs||[]).filter(j=>!j.archivedAt).sort((a,b)=>Number(['complete','cancelled'].includes(a.stage))-Number(['complete','cancelled'].includes(b.stage))||b.updatedAt.localeCompare(a.updatedAt));
 if(!jobs.length)return <p className="ops-warning">There are no jobs yet. <Link href="/admin/jobs?new=1">Create a job</Link> first, then attach daily logs to it.</p>;
 return <Field label="Job"><BrandedSelect aria-label="Job" required value={value} onChange={e=>onChange(e.target.value)}><option value="">Choose a job…</option>{jobs.map(j=><option key={j.id} value={j.id}>{`${j.number} · ${j.name}${j.stage==='complete'?' (complete)':j.stage==='cancelled'?' (cancelled)':''}`}</option>)}</BrandedSelect></Field>;
}

function Thumb({file,onRemove}:{file:File;onRemove:()=>void}){const [url,setUrl]=useState('');useEffect(()=>{const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u);},[file]);return <figure>{url&&<img src={url} alt={file.name}/>}<button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove}><X size={14}/></button></figure>;}
function AudioPreview({blob}:{blob:Blob}){const [url,setUrl]=useState('');useEffect(()=>{const u=URL.createObjectURL(blob);setUrl(u);return()=>URL.revokeObjectURL(u);},[blob]);return url?<audio controls src={url}/>:null;}
const clock=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

/** One form for all three log types. The job select decides where the log is attached. */
export function DailyLogComposer({kind,jobId:initialJob='',onSaved,onCancel}:{kind:LogKind;jobId?:string;onSaved:(log:JobLog)=>void;onCancel?:()=>void}){
 const {state,actor}=useOperations();
 const [jobId,setJobId]=useState(initialJob),[logDate,setLogDate]=useState(()=>today()),[title,setTitle]=useState(''),[content,setContent]=useState<unknown[]>(blankNote),[body,setBody]=useState('');
 const [audio,setAudio]=useState<Blob|null>(null),[recording,setRecording]=useState(false),[seconds,setSeconds]=useState(0),[auto,setAuto]=useState(true),[source,setSource]=useState<'device'|null>(null),[transcribing,setTranscribing]=useState(false);
 const [photos,setPhotos]=useState<File[]>([]),[status,setStatus]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),tick=useRef<ReturnType<typeof setInterval>|null>(null),capture=useRef<HTMLInputElement>(null),gallery=useRef<HTMLInputElement>(null),audioFile=useRef<HTMLInputElement>(null),autoRef=useRef(auto);
 autoRef.current=auto;
 useEffect(()=>()=>{if(tick.current)clearInterval(tick.current);if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());},[]);
 const readonly=actor.role==='viewer';
 async function transcribe(blob:Blob){setTranscribing(true);setError('');try{const text=await transcribeOnDevice(blob,setStatus);if(!text){setStatus('No speech was detected. Type the notes instead.');return;}setBody(prev=>prev.trim()?`${prev.trim()}\n${text}`:text);setSource('device');setStatus('Transcribed on this device. Review and edit before saving.');}catch(e){setStatus('');setError(e instanceof Error?e.message:'Transcription failed.');}finally{setTranscribing(false);}}
 function stop(){if(recorder.current?.state==='recording')recorder.current.stop();stream.current?.getTracks().forEach(t=>t.stop());if(tick.current)clearInterval(tick.current);setRecording(false);}
 async function start(){setError('');try{
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('Recording needs a browser with microphone access on HTTPS.');
  const media=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=media;
  const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t));const rec=new MediaRecorder(media,mime?{mimeType:mime}:undefined);recorder.current=rec;const chunks:Blob[]=[];let total=0;
  rec.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);total+=e.data.size;if(total>=LOG_LIMITS.audioBytes-1_000_000)stop();}};
  rec.onstop=()=>{const blob=new Blob(chunks,{type:baseMime(rec.mimeType||mime||'audio/webm')});setAudio(blob);if(autoRef.current)void transcribe(blob);};
  rec.start(1000);setSeconds(0);setRecording(true);setStatus('');
  tick.current=setInterval(()=>setSeconds(s=>{if(s+1>=MAX_SECONDS)stop();return s+1;}),1000);
 }catch(e){stream.current?.getTracks().forEach(t=>t.stop());setError(e instanceof DOMException&&e.name==='NotAllowedError'?'Microphone access was blocked. Allow it in your browser settings.':e instanceof Error?e.message:'Recording could not start.');}}
 async function addPhotos(list:FileList|null){if(!list?.length)return;setError('');const room=LOG_LIMITS.maxPhotos-photos.length;const picked=[...list].slice(0,room);if(list.length>room)setError(`A photo log holds up to ${LOG_LIMITS.maxPhotos} photos. Save this one and start another for the rest.`);setStatus('Preparing photos…');const ready:File[]=[];for(const f of picked){try{ready.push(await compressPhoto(f));}catch(e){setError(e instanceof Error?e.message:'A photo could not be added.');}}setPhotos(prev=>[...prev,...ready]);setStatus('');}
 async function save(e:React.FormEvent){e.preventDefault();setError('');
  const job=(state.jobs||[]).find(j=>j.id===jobId);if(!job){setError('Choose a job for this daily log.');return;}
  if(kind==='voice'&&!audio){setError('Record or choose a voice note first.');return;}
  if(kind==='photo'&&!photos.length){setError('Add at least one photo.');return;}
  const form=new FormData();form.set('payload',JSON.stringify({jobId,jobName:job.name,kind,logDate,title,content:kind==='note'?content:[],body:kind==='note'?'':body,transcriptSource:kind==='voice'?source:null}));
  if(kind==='voice'&&audio)form.append('files',new File([audio],`voice-note.${extensionFor(audio.type)}`,{type:baseMime(audio.type)}));
  for(const p of photos)form.append('files',p);
  setSaving(true);setStatus(kind==='photo'?`Uploading ${photos.length} photo${photos.length===1?'':'s'}…`:'Saving…');
  try{const res=await liveFetch('/api/jobs/logs',{method:'POST',body:form});if(!res.ok)throw new Error(await failure(res));setStatus('');onSaved((await res.json()).log);}catch(err){setStatus('');setError(err instanceof Error?err.message:'The daily log was not saved.');}finally{setSaving(false);}
 }
 if(readonly)return <p className="ops-warning">Your account is read-only. Ask an administrator for staff access to add daily logs.</p>;
 return <form className="ops-log-composer" onSubmit={e=>void save(e)}>
  <JobSelect value={jobId} onChange={setJobId}/>
  <div className="ops-form-grid"><Field label="Log date"><BrandedInput type="date" required value={logDate} onChange={e=>setLogDate(e.target.value)}/></Field><Field label="Title (optional)"><BrandedInput maxLength={LOG_LIMITS.title} value={title} onChange={e=>setTitle(e.target.value)} placeholder={kind==='photo'?'e.g. Before photos – kitchen':kind==='voice'?'e.g. End of day update':'e.g. Prep complete'}/></Field></div>
  {kind==='note'&&<div className="ops-log-editor"><Editor value={content} onChange={setContent}/></div>}
  {kind==='voice'&&<div className="ops-recorder">
   <div className="ops-actions">{recording?<Button type="button" onClick={stop}><Square size={16}/>Stop · {clock(seconds)}</Button>:<Button type="button" disabled={transcribing||saving} onClick={()=>void start()}><Mic size={16}/>{audio?'Record again':'Start recording'}</Button>}<Button type="button" variant="outline" disabled={recording||transcribing||saving} onClick={()=>audioFile.current?.click()}><Upload size={16}/>Choose audio file</Button></div>
   <input ref={audioFile} hidden type="file" accept="audio/*" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>LOG_LIMITS.audioBytes){setError('Recordings must be under 25 MB.');return;}setAudio(f);setStatus('');if(auto)void transcribe(f);}}/>
   {recording&&<p className="ops-recording" role="status"><span/>Recording… stops automatically at {clock(MAX_SECONDS)}.</p>}
   {audio&&!recording&&<AudioPreview blob={audio}/>}
   <label className="ops-inline"><BrandedInput type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/>Transcribe automatically when I stop</label>
   {audio&&!recording&&<Button type="button" size="sm" variant="outline" disabled={transcribing||saving} onClick={()=>void transcribe(audio)}>Transcribe this recording</Button>}
   <Field label="Transcript and notes"><textarea rows={6} maxLength={LOG_LIMITS.body} value={body} onChange={e=>setBody(e.target.value)} placeholder="The transcript appears here. You can edit it or type notes."/></Field>
   <p className="ops-muted">Transcription runs on this device; the recording is not sent to a transcription service. The first use downloads a speech model (about 80 MB) that your browser keeps for next time.</p>
  </div>}
  {kind==='photo'&&<div className="ops-log-photos-input">
   <input ref={capture} hidden type="file" accept="image/*" capture="environment" onChange={e=>{void addPhotos(e.target.files);e.target.value='';}}/>
   <input ref={gallery} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{void addPhotos(e.target.files);e.target.value='';}}/>
   <div className="ops-actions"><Button type="button" disabled={saving||photos.length>=LOG_LIMITS.maxPhotos} onClick={()=>capture.current?.click()}><Camera size={16}/>Take photo</Button><Button type="button" variant="outline" disabled={saving||photos.length>=LOG_LIMITS.maxPhotos} onClick={()=>gallery.current?.click()}><ImagePlus size={16}/>Choose photos</Button></div>
   {!!photos.length&&<div className="ops-log-thumbs">{photos.map((p,i)=><Thumb key={`${p.name}-${i}`} file={p} onRemove={()=>setPhotos(prev=>prev.filter((_,j)=>j!==i))}/>)}</div>}
   <p className="ops-muted">{photos.length} of {LOG_LIMITS.maxPhotos} photos. Large photos are resized before upload.</p>
   <Field label="Caption (optional)"><textarea rows={3} maxLength={LOG_LIMITS.body} value={body} onChange={e=>setBody(e.target.value)} placeholder="What do these photos show?"/></Field>
  </div>}
  {status&&<p role="status" className="ops-info">{status}</p>}
  {error&&<p role="alert" className="ops-error">{error}</p>}
  <div className="ops-actions"><Button type="submit" disabled={saving||recording||transcribing}>{saving?'Saving…':`Save ${LOG_KIND_LABELS[kind].toLowerCase()}`}</Button>{onCancel&&<Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>}</div>
 </form>;
}

function LogCard({log,showJob,onChanged,onDeleted}:{log:JobLog;showJob:boolean;onChanged:(l:JobLog)=>void;onDeleted:(id:string)=>void}){
 const {actor}=useOperations();const [editing,setEditing]=useState(false),[formatted,setFormatted]=useState(false),[confirm,setConfirm]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [title,setTitle]=useState(log.title),[body,setBody]=useState(log.body),[content,setContent]=useState<unknown[]>(log.content);
 const mine=canChange(log,actor);const Icon=LOG_TYPES.find(t=>t.kind===log.kind)!.Icon;
 async function saveEdit(){setBusy(true);setError('');try{const res=await liveFetch('/api/jobs/logs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:log.id,revision:log.revision,patch:log.kind==='note'?{title,content}:{title,body}})});if(!res.ok)throw new Error(await failure(res));onChanged((await res.json()).log);setEditing(false);}catch(e){setError(e instanceof Error?e.message:'Not saved.');}finally{setBusy(false);}}
 async function remove(){setBusy(true);setError('');try{const res=await liveFetch(`/api/jobs/logs?id=${encodeURIComponent(log.id)}`,{method:'DELETE'});if(!res.ok)throw new Error(await failure(res));onDeleted(log.id);}catch(e){setError(e instanceof Error?e.message:'Not deleted.');setBusy(false);}}
 return <article className={`ops-log-card kind-${log.kind}`}>
  <header><span className="ops-log-kind"><Icon size={14}/>{LOG_KIND_LABELS[log.kind]}</span><div><b>{log.title||LOG_KIND_LABELS[log.kind]}</b><small>{showJob&&<><Link href={`/admin/jobs/${log.jobId}`}>{log.jobName}</Link> · </>}{log.createdByName} · {new Date(log.createdAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/Phoenix'})}</small></div>
   {mine&&!editing&&<div className="ops-log-actions"><button type="button" aria-label="Edit daily log" onClick={()=>setEditing(true)}><Pencil size={15}/></button>{confirm?<><button type="button" className="danger" disabled={busy} onClick={()=>void remove()}>Delete</button><button type="button" onClick={()=>setConfirm(false)}>Keep</button></>:<button type="button" aria-label="Delete daily log" onClick={()=>setConfirm(true)}><Trash2 size={15}/></button>}</div>}
  </header>
  {editing?<div className="ops-log-edit"><Field label="Title"><BrandedInput maxLength={LOG_LIMITS.title} value={title} onChange={e=>setTitle(e.target.value)}/></Field>{log.kind==='note'?<div className="ops-log-editor"><Editor value={content} onChange={setContent}/></div>:<Field label={log.kind==='voice'?'Transcript and notes':'Caption'}><textarea rows={5} maxLength={LOG_LIMITS.body} value={body} onChange={e=>setBody(e.target.value)}/></Field>}<div className="ops-actions"><Button size="sm" disabled={busy} onClick={()=>void saveEdit()}>Save changes</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>{setEditing(false);setTitle(log.title);setBody(log.body);setContent(log.content);}}>Cancel</Button></div></div>
  :<>
   {log.kind==='note'&&(formatted?<div className="ops-log-editor readonly"><Editor value={log.content} onChange={()=>{}} readOnly/></div>:<p className="ops-prewrap ops-log-preview">{log.body}</p>)}
   {log.kind==='note'&&<button type="button" className="ops-link-button" onClick={()=>setFormatted(!formatted)}>{formatted?'Show plain text':'Show formatted note'}</button>}
   {log.kind==='voice'&&<>{log.media[0]&&<audio controls preload="metadata" src={mediaUrl(log,log.media[0].id)}/>}{log.body?<p className="ops-prewrap">{log.body}</p>:<p className="ops-muted">No transcript.</p>}{log.transcriptSource==='device'&&<small className="ops-muted">Transcribed on the recording device{log.revision>1?' · edited':''}</small>}</>}
   {log.kind==='photo'&&<><div className="ops-log-gallery">{log.media.map(m=><a key={m.id} href={mediaUrl(log,m.id)} target="_blank" rel="noreferrer"><img loading="lazy" src={mediaUrl(log,m.id)} alt={m.name}/></a>)}</div>{log.body&&<p className="ops-prewrap">{log.body}</p>}</>}
  </>}
  {error&&<p role="alert" className="ops-error">{error}</p>}
 </article>;
}

/** Logs grouped by day, newest first, with a type filter. */
export function DailyLogList({logs,loading,error,showJob,onChanged,onDeleted}:{logs:JobLog[];loading:boolean;error:string;showJob:boolean;onChanged:(l:JobLog)=>void;onDeleted:(id:string)=>void}){
 const [filter,setFilter]=useState('all');const kind={notes:'note',voice:'voice',photos:'photo'}[filter];
 const shown=logs.filter(l=>!kind||l.kind===kind);const days=[...new Set(shown.map(l=>l.logDate))];
 return <div className="ops-log-list"><div className="ops-toolbar"><p className="ops-muted">{shown.length} log{shown.length===1?'':'s'}</p><Views values={['all','notes','voice','photos']} value={filter} onChange={setFilter}/></div>
  {error&&<p role="alert" className="ops-error">{error}</p>}
  {loading&&!logs.length?<p className="ops-muted">Loading daily logs…</p>:!shown.length?<Empty>No daily logs here yet.</Empty>:days.map(day=><section key={day}><h3>{dateLabel(day)}</h3>{shown.filter(l=>l.logDate===day).map(l=><LogCard key={`${l.id}:${l.revision}`} log={l} showJob={showJob} onChanged={onChanged} onDeleted={onDeleted}/>)}</section>)}
 </div>;
}

/** Composer in a dialog: pick a type first unless one was chosen already. */
export function DailyLogDialog({open,kind:initialKind,jobId,onClose,onSaved}:{open:boolean;kind?:LogKind|null;jobId?:string;onClose:()=>void;onSaved?:(log:JobLog)=>void}){
 const [kind,setKind]=useState<LogKind|null>(initialKind||null),[saved,setSaved]=useState<JobLog|null>(null);
 const close=()=>{setSaved(null);setKind(initialKind||null);onClose();};
 return <Modal open={open} onClose={close} title={saved?'Daily log saved':kind?`Daily Logs · ${LOG_TYPES.find(t=>t.kind===kind)!.label}`:'Daily Logs'} description={saved?'It is attached to the job and visible to the team.':kind?'Choose the job, then add your log.':'Choose the type of log to add.'}>
  {saved?<><p>Saved to <b>{saved.jobName}</b>.</p><div className="ops-actions"><Button asChild><Link href={`/admin/jobs/${saved.jobId}?tab=logs`} onClick={close}>Open job logs</Link></Button><Button variant="outline" onClick={()=>{setSaved(null);setKind(null);}}>Add another log</Button></div></>
  :kind?<><button type="button" className="ops-link-button" onClick={()=>setKind(null)}>← Change log type</button><DailyLogComposer key={kind} kind={kind} jobId={jobId} onCancel={close} onSaved={log=>{setSaved(log);onSaved?.(log);}}/></>
  :<LogTypeChooser onPick={setKind}/>}
 </Modal>;
}

/** Daily Logs tab on a job. */
export function JobDailyLogs({jobId}:{jobId:string}){
 const {logs,loading,error,setLogs}=useJobLogs(jobId);const [kind,setKind]=useState<LogKind|null>(null);const {actor}=useOperations();
 return <><div className="ops-actions">{LOG_TYPES.map(({kind:k,label,Icon})=><Button key={k} size="sm" variant="outline" disabled={actor.role==='viewer'} onClick={()=>setKind(k)}><Icon size={15}/>{label}</Button>)}</div>
  <DailyLogList logs={logs} loading={loading} error={error} showJob={false} onChanged={l=>setLogs(prev=>prev.map(x=>x.id===l.id?l:x))} onDeleted={id=>setLogs(prev=>prev.filter(x=>x.id!==id))}/>
  {kind&&<DailyLogDialog key={kind} open kind={kind} jobId={jobId} onClose={()=>setKind(null)} onSaved={log=>setLogs(prev=>[log,...prev])}/>}</>;
}

/** All daily logs across jobs, at /admin/jobs/logs. `?new=note|voice|photo&job=` opens the composer. */
export function DailyLogsPage(){
 const {state,actor}=useOperations();const [job,setJob]=useState('');const {logs,loading,error,setLogs}=useJobLogs(job||undefined);const [dialog,setDialog]=useState<{kind:LogKind|null;jobId?:string}|null>(null);
 useEffect(()=>{const p=new URLSearchParams(location.search);const k=p.get('new');if(k)setDialog({kind:(['note','voice','photo'].includes(k)?k:null) as LogKind|null,jobId:p.get('job')||undefined});},[]);
 const jobs=(state.jobs||[]).filter(j=>!j.archivedAt);
 return <><PageTitle title="Daily Logs" description="Notes, voice notes and photos from every job.">{LOG_TYPES.map(({kind,label,Icon})=><Button key={kind} variant={kind==='note'?'default':'outline'} disabled={actor.role==='viewer'} onClick={()=>setDialog({kind,jobId:job||undefined})}><Icon size={16}/>{label}</Button>)}</PageTitle>
  <Panel title="Logs" action={<Link href="/admin/jobs">All jobs</Link>}><div className="ops-toolbar"><BrandedSelect aria-label="Filter by job" value={job} onChange={e=>setJob(e.target.value)}><option value="">All jobs</option>{jobs.map(j=><option key={j.id} value={j.id}>{`${j.number} · ${j.name}`}</option>)}</BrandedSelect></div>
   <DailyLogList logs={logs} loading={loading} error={error} showJob={!job} onChanged={l=>setLogs(prev=>prev.map(x=>x.id===l.id?l:x))} onDeleted={id=>setLogs(prev=>prev.filter(x=>x.id!==id))}/></Panel>
  {dialog&&<DailyLogDialog open kind={dialog.kind} jobId={dialog.jobId} onClose={()=>setDialog(null)} onSaved={log=>{if(!job||log.jobId===job)setLogs(prev=>[log,...prev]);}}/>}</>;
}
