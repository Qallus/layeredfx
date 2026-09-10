import {readFileSync, readdirSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, relative, extname} from 'node:path';
const [ctrl,channel] = process.argv.slice(2);
if (!ctrl || !channel) throw new Error('Supply the two pinned reference checkout paths.');
const slash = p=>p.replaceAll('\\','/');
function walk(root) {return readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory() && e.name!=='.git' ? walk(join(root,e.name)) : e.isFile() ? [join(root,e.name)] : []);}
function inventory(root,sha,routeRoot) {
  const files = walk(root).filter(p=>['.ts','.tsx','.js','.mjs','.sql'].includes(extname(p)));
  const index = new Map(files.map(p=>[slash(relative(root,p)),p]));
  function inspect(path) {
    const text=readFileSync(index.get(path),'utf8');
    const imports=[...text.matchAll(/(?:from\s*|import\s*\()['"](@\/[^'"]+|\.[^'"]+)['"]/g)].map(m=>m[1]);
    const dependencies=imports.map(p=>{
      const stem=p.startsWith('@/') ? p.slice(2) : slash(join(path.slice(0,path.lastIndexOf('/')),p));
      return [stem,...['.ts','.tsx','.js','.mjs','/index.ts','/index.tsx'].map(s=>stem+s)].find(p=>index.has(p))||null;
    }).filter(Boolean);
    return {path,dependencies,
      apiReferences:[...new Set([...text.matchAll(/['"`]((?:\/api\/)[^'"`\s]*)/g)].map(m=>m[1]))],
      tables:[...new Set([...text.matchAll(/\.from\(["']([^"']+)["']\)/g)].map(m=>m[1]))],
      exportedFunctions:[...text.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(m=>m[1]),
      uiText:[...new Set([...text.matchAll(/(?:<TabsTrigger[^>]*>|<SheetTitle[^>]*>|<DialogTitle[^>]*>|<CardTitle[^>]*>)([^<{]+)/g)].map(m=>m[1].trim()))],
    };
  }
  const routes=[...index.keys()].filter(p=>p.startsWith(routeRoot)&&/\/page\.tsx$/.test(p));
  const modules=routes.map(path=>{
    const seen=new Set(); const queue=[path]; const dependencies=[];
    while(queue.length) {const p=queue.shift();if(seen.has(p))continue;seen.add(p);const info=inspect(p);dependencies.push(info);queue.push(...info.dependencies);}
    return {sourceRoute:path.replace(/^app/,'').replace(/\/page\.tsx$/,''),sourcePath:path,sourceCommit:sha,status:routeRoot==='app/admin/'&&path==='app/admin/coupons/page.tsx'?'In progress':'Not migrated',evidenceLevel:'Static dependency discovery; individual behavior acceptance pending',dependencies};
  });
  const apis=[...index.keys()].filter(p=>p.startsWith('app/api/')&&p.endsWith('/route.ts')).map(inspect);
  return {sourceCommit:sha,modules,apiInventory:apis,sqlFiles:[...index.keys()].filter(p=>p.endsWith('.sql'))};
}
mkdirSync('docs/migration',{recursive:true});
const cp=inventory(ctrl,'015a7b58b80e63ef87c73bec549a23242b88f3e3','app/admin/');
const cc=inventory(channel,'8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf','app/app/admin/');
writeFileSync('docs/migration/source-inventory.json',JSON.stringify({ctrlp:cp,channelCast:cc},null,2)+'\n');
const rows=cp.modules.map(m=>{
 const root=m.dependencies[1]?.path||m.sourcePath;
 const apis=[...new Set(m.dependencies.flatMap(d=>d.apiReferences))];
 const tables=[...new Set(m.dependencies.flatMap(d=>d.tables))];
 return `| ${m.sourceRoute} | ${root} | ${apis.length} API references; ${tables.length} direct table references | ${m.sourceRoute==='/admin/coupons'?'In progress':'Not migrated'} |`;
});
writeFileSync('docs/migration/CTRL_P_DASHBOARD_PARITY.md',`# CTRL+P dashboard parity\n\nSource: ThePopOpp/ctrl-p, commit \`${cp.sourceCommit}\`. Reference checkout only; no source data or environment files imported.\n\nThis inventory preserves the full required scope. Static dependency discovery is not behavior verification. No feature is excluded. All nested API paths, imported components, table references and discovered UI labels are retained in [source-inventory.json](source-inventory.json). Provider endpoints and dynamically assembled paths require further manual tracing.\n\n| Source route | Primary component | Transitive dependency evidence | Status |\n|---|---|---|---|\n${rows.join('\n')}\n\n## Current increment: Coupons\n\nSource: components/admin/admin-coupons.tsx, app/api/admin/coupons/route.ts, app/api/admin/coupons/[couponId]/orders/route.ts, supabase/migrations/20260424000001_initial_schema.sql.\n\nActual source behavior: list with active/inactive and usage counts; create/edit drawer; immutable code; fixed/percentage discounts; minimum order, maximum use and expiry; activate/deactivate; delete confirmation; expand orders with discounts and paid revenue.\n\nDestination: app/admin/(operations)/coupons/page.tsx, components/admin/coupons.tsx, app/api/admin/coupons/route.ts, lib/admin/coupons.ts, lib/admin/coupon-repository.ts. Adapted management logic and fields, shared LayeredFX shell/session, labeled Radix dialog, bounded server JSON, allowlisted fields, organization-scoped normalized storage, compare-and-swap updates/deletes. Used coupons must be deactivated to preserve history.\n\nRemaining: order-history expansion, coupon application/redemption, manual order integration, source totals across all pages, schema execution, real authenticated persistence and browser CRUD. The schema is a review draft, not an applied migration. Status: In progress.\n\n## Source implementation limits to verify\n\nAnalytics renders AdminSectionPage with config-driven panels/actions; a button or config panel does not prove implemented analytics behavior. Each source module needs action-level acceptance before migration status advances. Projects is /admin/production-schedule; Plans will extend it. Content exists as a route but is absent from the source navigation groups and must remain in scope.\n\n## Verification\n\nSee ../reviews/current-review.md and logs for actual commands and outcomes. All other dashboard modules, nested actions, integration providers and customer-facing dependencies remain required. No module has been approved for exclusion.\n`);
console.log(`Inventoried ${cp.modules.length} CTRL+P pages, ${cp.apiInventory.length} APIs; ${cc.modules.length} Channel Cast admin pages, ${cc.apiInventory.length} APIs.`);
