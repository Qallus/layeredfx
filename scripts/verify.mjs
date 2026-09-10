import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('docs/reviews/logs',{recursive:true});
const checks=[];
for(const [name,command] of [['test','npm test'],['typecheck','npm run typecheck'],['lint','npm run lint'],['build','npm run build']]) {
 const result=spawnSync(command,{shell:true,encoding:'utf8',maxBuffer:20*1024*1024,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
 writeFileSync(`docs/reviews/logs/${name}-verified.txt`,result.stdout+result.stderr);
 checks.push({command,exitCode:result.status,signal:result.signal,error:result.error?.message||null,log:`${name}-verified.txt`});
 console.log(`${command}: exit ${result.status}`);
}
writeFileSync('docs/reviews/logs/verification.json',JSON.stringify({node:process.version,checks},null,2)+'\n');
if(checks.some(c=>c.exitCode!==0))process.exitCode=1;
