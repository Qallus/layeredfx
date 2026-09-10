"use client";
// Portable adaptation of Channel Cast's Plate editor. It keeps the same content_json
// format; provider-specific embeds, audio recording and live-app plugins are not loaded.
/* eslint-disable @typescript-eslint/no-explicit-any */
import {Plate,PlateContent,PlateElement,PlateLeaf,usePlateEditor} from 'platejs/react';
import {BoldPlugin,ItalicPlugin,UnderlinePlugin,StrikethroughPlugin,CodePlugin,HighlightPlugin,H1Plugin,H2Plugin,H3Plugin,BlockquotePlugin,HorizontalRulePlugin} from '@platejs/basic-nodes/react';
import {ListPlugin} from '@platejs/list/react';
import {toggleList} from '@platejs/list';
import {LinkPlugin} from '@platejs/link/react';
import {TablePlugin,TableRowPlugin,TableCellPlugin,TableCellHeaderPlugin} from '@platejs/table/react';
import {insertTable} from '@platejs/table';
const components:Record<string,any>={
 [BoldPlugin.key]:(p:any)=><PlateLeaf {...p} as="strong"/>,[ItalicPlugin.key]:(p:any)=><PlateLeaf {...p} as="em"/>,[UnderlinePlugin.key]:(p:any)=><PlateLeaf {...p} as="u"/>,[StrikethroughPlugin.key]:(p:any)=><PlateLeaf {...p} as="s"/>,[CodePlugin.key]:(p:any)=><PlateLeaf {...p} as="code"/>,[HighlightPlugin.key]:(p:any)=><PlateLeaf {...p} as="mark"/>,
 [H1Plugin.key]:(p:any)=><PlateElement {...p} as="h1"/>,[H2Plugin.key]:(p:any)=><PlateElement {...p} as="h2"/>,[H3Plugin.key]:(p:any)=><PlateElement {...p} as="h3"/>,[BlockquotePlugin.key]:(p:any)=><PlateElement {...p} as="blockquote"/>,[HorizontalRulePlugin.key]:(p:any)=><PlateElement {...p}><hr/>{p.children}</PlateElement>,
 [TablePlugin.key]:(p:any)=><PlateElement {...p} as="table"><tbody>{p.children}</tbody></PlateElement>,[TableRowPlugin.key]:(p:any)=><PlateElement {...p} as="tr"/>,[TableCellPlugin.key]:(p:any)=><PlateElement {...p} as="td"/>,[TableCellHeaderPlugin.key]:(p:any)=><PlateElement {...p} as="th"/>,
 [LinkPlugin.key]:(p:any)=><a {...p.attributes} href={/^https?:\/\//i.test(p.element.url||'')?p.element.url:undefined} rel="noopener noreferrer" target="_blank">{p.children}</a>
};
export function DocumentEditor({value,onChange,readOnly=false}:{value:unknown[];onChange:(value:unknown[])=>void;readOnly?:boolean}){
 const editor=usePlateEditor({plugins:[BoldPlugin,ItalicPlugin,UnderlinePlugin,StrikethroughPlugin,CodePlugin,HighlightPlugin,H1Plugin,H2Plugin,H3Plugin,BlockquotePlugin,HorizontalRulePlugin,ListPlugin,LinkPlugin,TablePlugin,TableRowPlugin,TableCellPlugin,TableCellHeaderPlugin],components,value:value as any});
 return <div className="ops-editor"><div className="ops-editor-toolbar" role="toolbar" aria-label="Document formatting">{[{key:'bold',label:'Bold'},{key:'italic',label:'Italic'},{key:'underline',label:'Underline'},{key:'strikethrough',label:'Strike'},{key:'code',label:'Code'},{key:'highlight',label:'Highlight'}].map(m=><button key={m.key} type="button" disabled={readOnly} onMouseDown={e=>e.preventDefault()} onClick={()=>editor.tf.toggleMark(m.key)}>{m.label}</button>)}{['p','h1','h2','h3','blockquote'].map(type=><button key={type} type="button" disabled={readOnly} onMouseDown={e=>e.preventDefault()} onClick={()=>editor.tf.setNodes({type})}>{type==='p'?'Text':type==='blockquote'?'Quote':type.toUpperCase()}</button>)}<button disabled={readOnly} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>toggleList(editor,{listStyleType:'disc'})}>Bullets</button><button disabled={readOnly} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>toggleList(editor,{listStyleType:'decimal'})}>Numbered</button><button disabled={readOnly} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>insertTable(editor)}>Table</button></div><Plate editor={editor} onValueChange={({value:next})=>onChange(next)}><PlateContent className="ops-editor-page" readOnly={readOnly} aria-label="Document content" placeholder="Start writing…"/></Plate></div>;
}
