import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=process.argv[2];
if(!root)throw new Error('CTRL+P reference checkout is required.');
const sha='015a7b58b80e63ef87c73bec549a23242b88f3e3';
const slash=s=>s.replaceAll('\\','/');
const skipped=new Set(['lib/supabase/browser.ts','lib/admin/mock-data.ts']);
const entries=fs.readdirSync(path.join(root,'components/admin')).filter(f=>f.endsWith('.tsx')&&f!=='admin-coupons.tsx').map(f=>'components/admin/'+f);
entries.push('components/dashboard/customer-profile.tsx');
const queue=[...entries],seen=new Set(),packages=new Set();
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
function resolve(from,spec){
 const stem=spec.startsWith('@/')?spec.slice(2):slash(path.join(path.dirname(from),spec));
 return [stem,...['.ts','.tsx','.mjs','/index.ts','/index.tsx'].map(s=>stem+s)].find(p=>fs.existsSync(path.join(root,p))&&fs.statSync(path.join(root,p)).isFile());
}
while(queue.length){
 const file=queue.shift();if(seen.has(file)||skipped.has(file))continue;seen.add(file);
 const raw=fs.readFileSync(path.join(root,file),'utf8');
 const source=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const isScreen=file.startsWith('components/admin/admin-')||file==='components/dashboard/customer-profile.tsx';
 const transformer=context=>{
  const visit=node=>{
   if(isScreen&&ts.isJsxElement(node)){
    const tag=node.openingElement.tagName.getText(source);
    const attrs=node.openingElement.attributes.getText(source);
    if((tag==='aside'&&attrs.includes('fixed'))||(tag==='header'&&attrs.includes('sticky')))return ts.factory.createJsxFragment(ts.factory.createJsxOpeningFragment(),[],ts.factory.createJsxJsxClosingFragment());
   }
   if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)){
    let value=node.text;
    if(value.startsWith('@/')){
     const resolved=resolve(file,value);if(resolved)queue.push(resolved);
     value=value.replace('@/', '@/ctrlp/');
    }else if((ts.isImportDeclaration(node.parent)||ts.isExportDeclaration(node.parent))&&value.startsWith('.')){
     const resolved=resolve(file,value);if(resolved)queue.push(resolved);
    }else if(ts.isImportDeclaration(node.parent)&&!value.startsWith('.'))packages.add(value);
    value=value.replaceAll('/api/','/api/ctrlp/').replaceAll('ControlP.io','LayeredFX').replaceAll('ControlP','LayeredFX').replaceAll('controlp_','layeredfx_');
    if(isScreen&&ts.isJsxAttribute(node.parent)&&node.parent.name.getText(source)==='className')value=value.replace(/\blg:pl-\[[^\]]+\]|\blg:pr-\d+/g,'').replaceAll('min-h-screen','min-h-full');
    if(value!==node.text)return ts.factory.createStringLiteral(value);
   }
   if(ts.isCallExpression(node)&&node.expression.getText(source)==='fetch')return ts.factory.updateCallExpression(node,ts.factory.createIdentifier('sourceFetch'),node.typeArguments,node.arguments.map(a=>ts.visitNode(a,visit)));
   return ts.visitEachChild(node,visit,context);
  };
  return node=>ts.visitNode(node,visit);
 };
 let transformed=ts.transform(source,[transformer]).transformed[0];
 let text=printer.printFile(transformed);
 if(text.includes('sourceFetch('))text=`import {sourceFetch} from '@/lib/dashboard/source-runtime';\n`+text;
 // Directives must precede imports.
 text=text.replace(/"use client";\s*/,'');if(raw.includes('"use client"'))text='"use client";\n'+text;
 if(file==='lib/admin/admin-api.ts'){
  const src=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
  const edits=[];
  for(const node of src.statements)if(ts.isFunctionDeclaration(node)&&['getCurrentAdminProfile','loadAdminDashboardData'].includes(node.name?.text)){
   const name=node.name.text;
   edits.push([node.getStart(src),node.end,`export async function ${name}() { return ${name==='getCurrentAdminProfile'?'sourceProfile()':'sourceDashboardData()'}; }`]);
  }
  for(const [start,end,replacement] of edits.reverse())text=text.slice(0,start)+replacement+text.slice(end);
  text=text.replace(/import \{ mockAdminData \}[^;]+;/,'');
  text=text.replace('"use client";','"use client";\nimport {sourceProfile,sourceDashboardData} from "@/lib/dashboard/source-runtime";');
 }
 text=`// Adapted from CTRL+P ${sha}: ${file}\n`+text;
 const out=path.join('ctrlp',file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text);
}
fs.mkdirSync('docs/migration',{recursive:true});
fs.writeFileSync('docs/migration/ported-client-files.json',JSON.stringify({sha,files:[...seen],packages:[...packages].sort()},null,2)+'\n');
console.log(`Ported ${seen.size} source files. External imports: ${[...packages].sort().join(', ')}`);
