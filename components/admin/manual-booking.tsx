"use client";
// Manual booking from Dashboard › Bookings: staff book an appointment for a customer and assign it to a
// LayeredFX team member. The booking is stored like any other; no email is sent to the customer from here.
import {useMemo, useState} from 'react';
import {CalendarPlus, Loader2} from 'lucide-react';
import {Button} from '@/ctrlp/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/ctrlp/components/ui/dialog';
import {Input} from '@/ctrlp/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/ctrlp/components/ui/select';
import {Textarea} from '@/ctrlp/components/ui/textarea';
import {useOperations} from '@/components/operations/provider';
import {sourceFetch} from '@/lib/dashboard/source-runtime';
import {appointments} from '@/lib/bookings/catalog';
import {BOOKING_STATUSES, human} from '@/lib/bookings/model';
import {PROFILE_GROUP_LABELS} from '@/lib/profiles/public';
import type {ProfileGroup} from '@/lib/operations/types';

const STATUS_CHOICES = BOOKING_STATUSES.filter(status => ['confirmed', 'pending', 'completed'].includes(status));
const NONE = '__none__';
const blank = {appointment: appointments[0].slug, date: '', time: '09:00', status: 'confirmed', firstName: '', lastName: '', email: '', phone: '', company: '', message: '', internal_notes: '', assigned_staff_id: NONE, partner: NONE};

export function ManualBooking({onCreated}: {onCreated: (message: string) => void}) {
  const {state, actor} = useOperations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const readOnly = actor.role === 'viewer';
  const members = useMemo(() => state.people.filter(person => person.role !== 'viewer'), [state.people]);
  // Partners are profiles, not sign-in accounts, so they are recorded in the internal notes.
  const partners = useMemo(() => (state.team || []).filter(member => member.status === 'active' && (member.group || 'team') !== 'team'), [state.team]);
  const set = (patch: Partial<typeof blank>) => setForm(current => ({...current, ...patch}));
  const minutes = appointments.find(item => item.slug === form.appointment)?.minutes ?? 30;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const partner = partners.find(item => item.id === form.partner);
      const notes = [form.internal_notes.trim(), partner ? `Partner: ${partner.name} (${PROFILE_GROUP_LABELS[(partner.group || 'installer') as ProfileGroup].label})` : ''].filter(Boolean).join('\n');
      const response = await sourceFetch('/api/ctrlp/admin/bookings', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          resource: 'appointment', appointment: form.appointment, date: form.date, time: form.time, status: form.status,
          firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, company: form.company,
          message: form.message, internal_notes: notes, assigned_staff_id: form.assigned_staff_id === NONE ? '' : form.assigned_staff_id,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'The appointment was not created.');
      setForm(blank); setOpen(false);
      onCreated('Appointment booked.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The appointment was not created.');
    } finally { setBusy(false); }
  }

  return <>
    <Button variant="outline" disabled={readOnly} onClick={() => setOpen(true)}><CalendarPlus className="mr-2 h-4 w-4"/>Manual booking</Button>
    <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) setError(''); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual booking</DialogTitle>
          <DialogDescription>Book an appointment for a customer and assign it to your team. No email is sent to the customer from here.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">Appointment type
              <Select value={form.appointment} onValueChange={value => set({appointment: value})}>
                <SelectTrigger aria-label="Appointment type"><SelectValue/></SelectTrigger>
                <SelectContent>{appointments.map(item => <SelectItem key={item.slug} value={item.slug}>{item.name} · {item.minutes} min</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm">Status
              <Select value={form.status} onValueChange={value => set({status: value})}>
                <SelectTrigger aria-label="Status"><SelectValue/></SelectTrigger>
                <SelectContent>{STATUS_CHOICES.map(status => <SelectItem key={status} value={status}>{human(status)}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm">Date<Input required type="date" value={form.date} onChange={e => set({date: e.target.value})}/></label>
            <label className="grid gap-1.5 text-sm">Start time (Arizona) — {minutes} min<Input required type="time" step={300} value={form.time} onChange={e => set({time: e.target.value})}/></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">First name<Input required maxLength={75} value={form.firstName} onChange={e => set({firstName: e.target.value})}/></label>
            <label className="grid gap-1.5 text-sm">Last name<Input maxLength={75} value={form.lastName} onChange={e => set({lastName: e.target.value})}/></label>
            <label className="grid gap-1.5 text-sm">Email<Input required type="email" maxLength={254} value={form.email} onChange={e => set({email: e.target.value})}/></label>
            <label className="grid gap-1.5 text-sm">Phone<Input maxLength={40} value={form.phone} onChange={e => set({phone: e.target.value})}/></label>
            <label className="grid gap-1.5 text-sm sm:col-span-2">Company<Input maxLength={200} value={form.company} onChange={e => set({company: e.target.value})}/></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">Assign to team member
              <Select value={form.assigned_staff_id} onValueChange={value => set({assigned_staff_id: value})}>
                <SelectTrigger aria-label="Assign to team member"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>Unassigned</SelectItem>{members.map(person => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm">Partner
              <Select value={form.partner} onValueChange={value => set({partner: value})}>
                <SelectTrigger aria-label="Partner"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>None</SelectItem>{partners.map(item => <SelectItem key={item.id} value={item.id}>{item.name} · {PROFILE_GROUP_LABELS[(item.group || 'installer') as ProfileGroup].label}</SelectItem>)}</SelectContent>
              </Select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Installers, designers, contractors and vendors are profiles rather than sign-in accounts, so the partner is written into the internal notes below instead of the assignment field.</p>
          <label className="grid gap-1.5 text-sm">Customer notes<Textarea maxLength={3000} rows={2} value={form.message} onChange={e => set({message: e.target.value})}/></label>
          <label className="grid gap-1.5 text-sm">Internal notes<Textarea maxLength={5000} rows={2} value={form.internal_notes} onChange={e => set({internal_notes: e.target.value})}/></label>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Booking…</> : 'Book appointment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
