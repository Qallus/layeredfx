import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
const root=process.argv[2];if(!root)throw new Error('Provide the CMI app root');
const queue=['app/dashboard/jobs/jobs-list-client.tsx','app/dashboard/jobs/new/new-job-client.tsx','app/dashboard/jobs/map/jobs-map-client.tsx','app/dashboard/jobs/[jobId]/summary/job-summary-client.tsx','app/dashboard/jobs/[jobId]/info/job-info-client.tsx','lib/jobs/reporting.ts'];const seen=new Set();
while(queue.length){const p=queue.shift();if(seen.has(p))continue;seen.add(p);let s=fs.readFileSync(path.join(root,p),'utf8');
 if(p==='lib/jobs/data.ts')s='import type {Job} from "./types";\nexport type JobListRow=Job & {type_name:string|null;type_color:string|null;group_name:string|null;clients:{name:string;phone:string|null}[];project_managers:string[]};';
 const sf=ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true);const edits=[];
 function visit(n){if(ts.isStringLiteral(n)&&n.text.startsWith('@/')){const stem=n.text.slice(2);const resolved=[stem,stem+'.ts',stem+'.tsx'].find(f=>fs.existsSync(path.join(root,f)));if(resolved)queue.push(resolved);edits.push([n.getStart(sf),n.end,JSON.stringify(n.text.replace('@/','@/cmi/'))]);}else if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text.startsWith('.')){const stem=path.join(path.dirname(p),n.moduleSpecifier.text).replaceAll('\\','/');const resolved=[stem,stem+'.ts',stem+'.tsx'].find(f=>fs.existsSync(path.join(root,f)));if(resolved)queue.push(resolved);}ts.forEachChild(n,visit);}visit(sf);for(const[a,b,t]of edits.sort((a,b)=>b[0]-a[0]))s=s.slice(0,a)+t+s.slice(b);
 s=s.replaceAll('/dashboard/jobs','/admin/jobs').replaceAll('/api/','/api/ctrlp/cmi/').replace(/\bfetch\(/g,'sourceFetch(');
 if(s.includes('sourceFetch('))s=s.replace('"use client";','"use client";\nimport {sourceFetch} from "@/lib/dashboard/source-runtime";');
 const out='cmi/'+p;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,`// Adapted from CMI 23320abb158e26f0945c2f1ce2f513f02649aa70: ${p}\n`+s);
}
fs.writeFileSync('docs/migration/cmi-client-files.json',JSON.stringify({sha:'23320abb158e26f0945c2f1ce2f513f02649aa70',files:[...seen]},null,2)+'\n');console.log(`Ported ${seen.size} CMI files`);
