"use client";
// Appointment → Leads / Pipeline. The server swaps in the stored booking, so the lead, contact and opportunity
// carry the real appointment details; repeating either action reuses the same records.
import {useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,TrendingUp,UserPlus} from 'lucide-react';
import {Button} from '@/ctrlp/components/ui/button';
import {useOperations} from '@/components/operations/provider';
import {operationsBooking,type BookingLike} from '@/lib/bookings/model';

export function BookingLeadActions({appointment}:{appointment:BookingLike}){
 const {state,dispatch,busy,actor}=useOperations();
 const [message,setMessage]=useState('');
 const lead=state.leads.find(item=>item.bookings?.some(record=>record.id===appointment.id));
 const readOnly=actor.role==='viewer';
 async function add(type:'booking.import'|'booking.pipeline'){
  setMessage('');
  const result=await dispatch({type,bookingId:appointment.id,booking:operationsBooking(appointment)});
  if(result)setMessage(type==='booking.import'?'Added to Leads with the appointment details.':'Added to Pipeline with the appointment details.');
 }
 return <div className="grid gap-2">
  <div className="text-xs font-medium text-muted-foreground">Sales follow-up</div>
  <div className="grid gap-2 sm:grid-cols-2">
   {lead?<Button variant="outline" asChild><Link href="/admin/leads"><ArrowUpRight className="mr-2 h-4 w-4"/>Open lead</Link></Button>
    :<Button variant="outline" disabled={busy||readOnly} onClick={()=>void add('booking.import')}><UserPlus className="mr-2 h-4 w-4"/>Add to Leads</Button>}
   {lead?.opportunityId?<Button variant="outline" asChild><Link href={`/admin/pipeline/${lead.opportunityId}`}><ArrowUpRight className="mr-2 h-4 w-4"/>Open in Pipeline</Link></Button>
    :<Button variant="outline" disabled={busy||readOnly} onClick={()=>void add('booking.pipeline')}><TrendingUp className="mr-2 h-4 w-4"/>Add to Pipeline</Button>}
  </div>
  {message&&<p role="status" className="text-xs text-muted-foreground">{message}</p>}
 </div>;
}
