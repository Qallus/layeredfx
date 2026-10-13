/// <reference lib="webworker" />
// On-device speech-to-text for voice daily logs. The Whisper model downloads once from the Hugging Face hub, is cached by
// the browser, and runs locally: the recording is never sent to a transcription service.
import {pipeline,env} from '@huggingface/transformers';
env.allowLocalModels=false;
if(env.backends.onnx.wasm)env.backends.onnx.wasm.numThreads=1;
const SPEECH_MODEL='Xenova/whisper-base.en';
type Transcriber=(audio:Float32Array,options:Record<string,unknown>)=>Promise<{text:string}|{text:string}[]>;
let model:Promise<Transcriber>|null=null;
const progress=new Map<string,{loaded:number;total:number}>();
self.onmessage=async(e:MessageEvent<{id:number;audio:Float32Array}>)=>{
 const{id,audio}=e.data;
 try{
  model||=pipeline('automatic-speech-recognition',SPEECH_MODEL,{device:'wasm',dtype:'q8',progress_callback:(p:{status:string;file?:string;loaded?:number;total?:number})=>{
   if(p.status!=='progress'||!p.file||!p.total)return;progress.set(p.file,{loaded:p.loaded||0,total:p.total});
   const all=[...progress.values()],loaded=all.reduce((n,f)=>n+f.loaded,0),total=all.reduce((n,f)=>n+f.total,0);
   self.postMessage({id,status:`Downloading the speech model (first use only)… ${Math.round(loaded/total*100)}%`});
  }}) as unknown as Promise<Transcriber>;
  const run=await model;
  self.postMessage({id,status:'Transcribing on this device…'});
  const out=await run(audio,{chunk_length_s:30,stride_length_s:5});
  const text=(Array.isArray(out)?out.map(o=>o.text).join(' '):out.text).replace(/\s+/g,' ').trim();
  self.postMessage({id,text});
 }catch(error){model=null;self.postMessage({id,error:'Transcription could not finish on this device. Check your connection for the first download, or type the notes instead.',detail:error instanceof Error?error.message:String(error)});}
};
