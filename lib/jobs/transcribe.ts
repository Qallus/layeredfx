"use client";
// Decodes a recording to 16 kHz mono and hands it to the on-device Whisper worker.
let worker:Worker|null=null,next=0;
export async function transcribeOnDevice(audio:Blob,onStatus:(message:string)=>void):Promise<string>{
 onStatus('Preparing the recording…');
 const AudioCtx=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
 if(!AudioCtx)throw new Error('This browser cannot decode audio for transcription.');
 const ctx=new AudioCtx({sampleRate:16000});
 let samples:Float32Array;
 try{const decoded=await ctx.decodeAudioData(await audio.arrayBuffer());samples=new Float32Array(decoded.length);for(let c=0;c<decoded.numberOfChannels;c++){const data=decoded.getChannelData(c);for(let i=0;i<data.length;i++)samples[i]+=data[i]/decoded.numberOfChannels;}}
 catch{throw new Error('This recording could not be decoded for transcription.');}
 finally{void ctx.close();}
 if(samples.length<1600)throw new Error('The recording is too short to transcribe.');
 worker||=new Worker(new URL('./transcribe.worker.ts',import.meta.url),{type:'module'});
 const id=++next,w=worker;
 return new Promise((resolve,reject)=>{
  const listen=(e:MessageEvent<{id:number;status?:string;text?:string;error?:string}>)=>{if(e.data.id!==id)return;if(e.data.status){onStatus(e.data.status);return;}w.removeEventListener('message',listen);w.removeEventListener('error',crashed);if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.text||'');};
  const crashed=()=>{w.removeEventListener('message',listen);w.removeEventListener('error',crashed);worker=null;w.terminate();reject(new Error('The speech model could not start on this device. Type the notes instead.'));};
  w.addEventListener('message',listen);w.addEventListener('error',crashed);w.postMessage({id,audio:samples},[samples.buffer]);
 });
}
