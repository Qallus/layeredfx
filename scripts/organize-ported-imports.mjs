import ts from 'typescript';
import fs from 'node:fs';
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,process.cwd());
const host={...ts.sys,getScriptFileNames:()=>parsed.fileNames,getScriptVersion:()=> '0',getScriptSnapshot:file=>ts.sys.fileExists(file)?ts.ScriptSnapshot.fromString(ts.sys.readFile(file)):undefined,getCurrentDirectory:()=>process.cwd(),getCompilationSettings:()=>parsed.options,getDefaultLibFileName:opts=>ts.getDefaultLibFilePath(opts)};
const service=ts.createLanguageService(host);
let count=0;
for(const file of parsed.fileNames.filter(f=>/[\\/](ctrlp|cmi)[\\/]/.test(f))){
 for(const edit of service.organizeImports({type:'file',fileName:file},{},{})){
  let source=fs.readFileSync(edit.fileName,'utf8');
  for(const change of [...edit.textChanges].sort((a,b)=>b.span.start-a.span.start))source=source.slice(0,change.span.start)+change.newText+source.slice(change.span.start+change.span.length);
  fs.writeFileSync(edit.fileName,source);count++;
 }
}
console.log(`Organized imports in ${count} source files.`);
