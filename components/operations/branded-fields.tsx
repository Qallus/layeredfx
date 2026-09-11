"use client";
import React,{Children,isValidElement,useState,forwardRef,useRef,useEffect} from 'react';
import * as Select from '@radix-ui/react-select';
import {Check,ChevronDown,CalendarDays,ChevronLeft,ChevronRight} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/layeredfx/ui/dialog';

type SelectProps=React.SelectHTMLAttributes<HTMLSelectElement>;
export function BrandedSelect({children,value,defaultValue,onChange,disabled,required,name,id,className,...props}:SelectProps){
 const options:React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>[]=[];
 function collect(nodes:React.ReactNode){Children.forEach(nodes,node=>{if(!isValidElement(node))return;if(node.type==='option')options.push(node as typeof options[number]);else collect((node.props as {children?:React.ReactNode}).children);});}collect(children);
 const [local,setLocal]=useState(String(defaultValue??options[0]?.props.value??options[0]?.props.children??''));
 const current=String(value??local);const empty='__lfx_empty__';
 return <Select.Root value={current} onValueChange={v=>{const next=v===empty?'':v;setLocal(next);onChange?.({target:{value:next,name},currentTarget:{value:next,name}} as React.ChangeEvent<HTMLSelectElement>);}} disabled={disabled} required={required} name={name}>
 <Select.Trigger id={id} className={`ops-select ${className||''}`} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']}><Select.Value placeholder={options.find(o=>o.props.value==='')?.props.children}/><Select.Icon><ChevronDown size={16}/></Select.Icon></Select.Trigger>
 <Select.Portal><Select.Content className="ops-select-menu" position="popper" sideOffset={5}><Select.ScrollUpButton>⌃</Select.ScrollUpButton><Select.Viewport>{options.map((option,i)=>{const v=String(option.props.value??option.props.children??'');return <Select.Item key={`${v}-${i}`} value={v||empty} disabled={option.props.disabled} className="ops-select-option"><Select.ItemText>{option.props.children}</Select.ItemText><Select.ItemIndicator><Check size={16}/></Select.ItemIndicator></Select.Item>;})}</Select.Viewport><Select.ScrollDownButton>⌄</Select.ScrollDownButton></Select.Content></Select.Portal>
 </Select.Root>;
}

export const BrandedInput=forwardRef<HTMLInputElement,React.InputHTMLAttributes<HTMLInputElement>>(function BrandedInput({type,...props},ref){
 const[open,setOpen]=useState(false),[month,setMonth]=useState(()=>new Date().toISOString().slice(0,7)),[local,setLocal]=useState(String(props.defaultValue||''));
 const inputRef=useRef<HTMLInputElement|null>(null);
 useEffect(()=>{const v=String(props.value??local);let valid=true;if(v&&['date','time','datetime-local'].includes(type||'')){
  if(type!=='time'){const day=v.slice(0,10);const d=new Date(`${day}T12:00:00Z`);valid=!isNaN(d.getTime())&&d.toISOString().slice(0,10)===day;}
  if(type!=='date'){const t=type==='time'?v:v.slice(11);valid=valid&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);}
  valid=valid&&(!props.min||v>=String(props.min))&&(!props.max||v<=String(props.max));
 }inputRef.current?.setCustomValidity(valid?'':'Choose a valid value within the allowed range.');},[props.value,local,props.min,props.max,type]);
 if(!['date','time','datetime-local'].includes(type||''))return <input type={type} {...props} ref={ref}/>;
 const value=String(props.value??local);const isTime=type==='time',hasTime=isTime||type==='datetime-local';
 const date=value.slice(0,10),time=isTime?value:value.slice(11);
 function change(next:string){setLocal(next);props.onChange?.({target:{value:next,name:props.name},currentTarget:{value:next,name:props.name}} as React.ChangeEvent<HTMLInputElement>);}
 const first=new Date(`${month}-01T12:00:00`);const days=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
 function move(n:number){const d=new Date(first);d.setMonth(d.getMonth()+n);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);}
 return <div className="ops-date-control"><input {...props} ref={node=>{inputRef.current=node;if(typeof ref==='function')ref(node);else if(ref)ref.current=node;}} type="text" defaultValue={undefined} value={value} placeholder={props.placeholder||(isTime?'HH:MM':hasTime?'YYYY-MM-DDTHH:MM':'YYYY-MM-DD')} pattern={isTime?'[0-9]{2}:[0-9]{2}':hasTime?'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}':'[0-9]{4}-[0-9]{2}-[0-9]{2}'} onChange={e=>{setLocal(e.target.value);props.onChange?.(e);}}/><button type="button" disabled={props.disabled||props.readOnly} aria-label={isTime?'Choose time':'Choose date'} onClick={()=>{if(/^\d{4}-(0[1-9]|1[0-2])/.test(value))setMonth(value.slice(0,7));setOpen(true);}}><CalendarDays size={18}/></button>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="ops-date-picker"><DialogTitle>{isTime?'Choose time':'Choose date'}</DialogTitle><DialogDescription>Select a value, then choose Done.</DialogDescription>{!isTime&&<><div className="ops-picker-month"><button type="button" aria-label="Previous month" onClick={()=>move(-1)}><ChevronLeft/></button><b>{first.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</b><button type="button" aria-label="Next month" onClick={()=>move(1)}><ChevronRight/></button></div><div className="ops-picker-grid">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><span key={d}>{d}</span>)}{Array.from({length:first.getDay()},(_,i)=><span key={`blank${i}`}/>)}{Array.from({length:days},(_,i)=>{const next=`${month}-${String(i+1).padStart(2,'0')}`;return <button type="button" key={next} aria-label={next} aria-pressed={date===next} disabled={!!((props.min&&next<String(props.min).slice(0,10))||(props.max&&next>String(props.max).slice(0,10)))} onClick={()=>change(hasTime?`${next}T${time||'09:00'}`:next)}>{i+1}</button>;})}</div></>}{hasTime&&<div className="ops-picker-time"><BrandedSelect aria-label="Hour" value={time.slice(0,2)||'09'} onChange={e=>change(`${isTime?'':`${date||`${month}-01`}T`}${e.target.value}:${time.slice(3,5)||'00'}`)}>{Array.from({length:24},(_,i)=><option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}</BrandedSelect><span>:</span><BrandedSelect aria-label="Minute" value={time.slice(3,5)||'00'} onChange={e=>change(`${isTime?'':`${date||`${month}-01`}T`}${time.slice(0,2)||'09'}:${e.target.value}`)}>{Array.from({length:60},(_,i)=><option key={i} value={String(i).padStart(2,'0')}>{String(i).padStart(2,'0')}</option>)}</BrandedSelect></div>}<div className="ops-picker-month"><button type="button" onClick={()=>change('')}>Clear</button><button type="button" onClick={()=>setOpen(false)}>Done</button></div></DialogContent></Dialog></div>;
});
