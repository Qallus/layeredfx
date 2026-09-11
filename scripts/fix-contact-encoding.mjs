import fs from 'node:fs';
const decoder=new TextDecoder('windows-1252'),utf8=new TextDecoder('utf-8',{fatal:true});
const bytes=new Map(Array.from({length:256},(_,i)=>[decoder.decode(Uint8Array.of(i)),i]));
for(const file of ['components/operations/contacts.tsx','components/operations/shell.tsx','lib/dashboard/navigation.ts','lib/channelcast/phone-import.ts','lib/channelcast/contacts.ts']){
 let source=fs.readFileSync(file,'utf8');
 for(let pass=0;pass<3;pass++){let next='';for(let i=0;i<source.length;i++){const b=bytes.get(source[i]);const len=b>=0xc2&&b<=0xdf?2:b>=0xe0&&b<=0xef?3:b>=0xf0&&b<=0xf4?4:0;const chunk=Array.from(source.slice(i,i+len),c=>bytes.get(c));if(len&&chunk.length===len&&chunk.slice(1).every(b=>b>=0x80&&b<=0xbf)){try{next+=utf8.decode(Uint8Array.from(chunk));i+=len-1;continue;}catch{}}next+=source[i];}source=next;}
 fs.writeFileSync(file,source);
}
