'use client';
import {useState} from 'react';
import * as Select from '@radix-ui/react-select';
import * as Toggle from '@radix-ui/react-toggle';
import * as Dialog from '@radix-ui/react-dialog';
import {DayPicker} from 'react-day-picker';
import {CalendarDays,Check,Plus,X} from 'lucide-react';
import 'react-day-picker/style.css';
import './estimate-controls.css';

export function EstimateToggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}){return <Toggle.Root type="button" className="ws-estimate-toggle" pressed={checked} onPressedChange={onChange} aria-label={label}>{checked?<Check size={17}/>:<Plus size={17}/>}<span>{label}</span></Toggle.Root>;}
export function EstimateSelect({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(value:string)=>void}){return <Select.Root value={value} onValueChange={onChange}><Select.Trigger className="ws-estimate-select" aria-label={label}><Select.Value/></Select.Trigger><Select.Portal><Select.Content position="popper" sideOffset={5} className="ws-estimate-options"><Select.ScrollUpButton>Scroll up</Select.ScrollUpButton><Select.Viewport>{options.map(option=><Select.Item key={option} value={option} className="ws-estimate-option"><Select.ItemText>{option}</Select.ItemText><Select.ItemIndicator><Check size={16}/></Select.ItemIndicator></Select.Item>)}</Select.Viewport><Select.ScrollDownButton>Scroll down</Select.ScrollDownButton></Select.Content></Select.Portal></Select.Root>;}
const pad=(n:number)=>String(n).padStart(2,'0');
export function EstimateDateTime({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const [open,setOpen]=useState(false);
 const [date,time='09:00']=value.split('T'),[hour,minute]=time.split(':');
 const today=new Date(Date.now()-7*3600000).toISOString().slice(0,10);
 const selected=date?new Date(date+'T12:00:00'):undefined;
 return <div className="ws-date-field"><span>Install date and time request (Arizona time)</span><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger type="button" className="ws-estimate-select"><CalendarDays size={18}/>{value?date+' at '+time:'Choose date and time'}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="ws-date-overlay"/><Dialog.Content className="ws-date-dialog"><Dialog.Title>Requested installation</Dialog.Title><Dialog.Description>Choose a date and time in Arizona (MST).</Dialog.Description><Dialog.Close className="ws-date-close" aria-label="Close date picker"><X size={18}/></Dialog.Close><DayPicker mode="single" selected={selected} defaultMonth={selected} disabled={{before:new Date(today+'T00:00:00')}} onSelect={d=>{if(d)onChange(d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+time);}}/><div className="ws-time-fields"><label>Hour<EstimateSelect label="Requested hour" value={hour} options={Array.from({length:24},(_,i)=>pad(i))} onChange={h=>onChange((date||today)+'T'+h+':'+minute)}/></label><label>Minute<EstimateSelect label="Requested minute" value={minute} options={Array.from({length:60},(_,i)=>pad(i))} onChange={m=>onChange((date||today)+'T'+hour+':'+m)}/></label></div><Dialog.Close className="ws-date-done">Done</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root></div>;
}
