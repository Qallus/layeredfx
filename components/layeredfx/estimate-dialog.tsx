"use client";
import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCheck, Download, ImagePlus, X } from "lucide-react";
import { services, type Service } from "@/lib/layeredfx/content";
import { validateContact, validatePhoto, MAX_PHOTOS } from "@/lib/layeredfx/validation.mjs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; service?: Service; finish?: string };
export function EstimateDialog({ open, onOpenChange, service, finish }: Props) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState("Residential");
  const [selected, setSelected] = useState<Service[]>(service ? [service] : []);
  const [contact, setContact] = useState({ name: "", email: "", city: "", notes: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; photos?: string }>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  useEffect(() => { if (!open) setPhotos([]); }, [open]);
  useEffect(() => {
    const urls = photos.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [photos]);
  function toggle(service: Service) { setSelected(current => current.includes(service) ? current.filter(value => value !== service) : [...current, service]); }
  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const additions = Array.from(event.target.files || []);
    const message = photos.length + additions.length > MAX_PHOTOS ? "Choose up to four photos." : additions.map(validatePhoto).find(Boolean);
    if (message) setErrors(current => ({ ...current, photos: message }));
    else { setErrors(current => ({ ...current, photos: undefined })); setPhotos(current => [...current, ...additions]); }
    event.target.value = "";
  }
  function next() {
    if (step === 0 && !selected.length) return;
    if (step === 1) { const result = validateContact(contact); setErrors(result); if (Object.keys(result).length) return; }
    setStep(current => current + 1);
  }
  function exportBrief() {
    const brief = { mode: "PREVIEW ONLY — NOT SUBMITTED", projectType: kind, services: selected, finishInspiration: finish || null, ...contact, photoNames: photos.map(file => file.name), note: "Photo bytes are not included. No data was submitted to LayeredFX." };
    const url = URL.createObjectURL(new Blob([JSON.stringify(brief, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "layeredfx-preview-brief.json"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="lfx-estimate-dialog">
    <div className="lfx-eyebrow">Your space / A new possibility</div>
    <DialogTitle>{done ? "Your ideas, all in one place." : "Let’s start with your space."}</DialogTitle>
    <DialogDescription>This is an interactive estimate preview. Nothing is sent, uploaded, booked, or stored on a server.</DialogDescription>
    {!done ? <>
      <div className="lfx-form-steps" aria-label={`Step ${step + 1} of 3`}>{["Your project", "The details", "Review"].map((label, index) => <span className={index <= step ? "is-active" : ""} key={label}><i>{index < step ? <Check size={13} /> : index + 1}</i>{label}</span>)}</div>
      {step === 0 && <div className="lfx-form-step"><fieldset><legend>What kind of space?</legend><div className="lfx-kind-options">{["Residential", "Commercial"].map(value => <label key={value} className={kind === value ? "is-active" : ""}><input type="radio" name="project-kind" checked={kind === value} onChange={() => setKind(value)} />{value}</label>)}</div></fieldset><fieldset><legend>What would you like to transform? <span>Select any that apply.</span></legend><div className="lfx-service-options">{services.map(value => <label key={value} className={selected.includes(value) ? "is-active" : ""}><input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} /><span>{value}</span></label>)}</div></fieldset>{finish && <p className="lfx-finish-summary">Your finish inspiration: <strong>{finish}</strong></p>}</div>}
      {step === 1 && <div className="lfx-form-step"><div className="lfx-field-grid"><label>Your name<Input name="name" aria-label="Your name" autoComplete="name" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name && <small className="lfx-error" id="name-error">{errors.name}</small>}</label><label>Email address<Input type="email" name="email" aria-label="Email address" autoComplete="email" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <small className="lfx-error" id="email-error">{errors.email}</small>}</label></div><label>Project city <span className="lfx-optional">Optional</span><Input autoComplete="address-level2" value={contact.city} onChange={e => setContact({ ...contact, city: e.target.value })} /></label><label>Tell us a little about your ideas<textarea className="lfx-input" rows={3} value={contact.notes} onChange={e => setContact({ ...contact, notes: e.target.value })} placeholder="The surfaces, the feeling, the possibilities…" /></label><label className="lfx-upload"><ImagePlus size={23} /><span>Add a few photos<small>JPG, PNG, or WebP · 8 MB each · Up to 4</small></span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addPhotos} /></label>{errors.photos && <p className="lfx-error" role="alert">{errors.photos}</p>}{photos.length > 0 && <div className="lfx-photo-previews">{photos.map((file, index) => <div key={`${file.name}-${index}`}><div className="lfx-photo-thumb" style={{ backgroundImage: previews[index] ? `url("${previews[index]}")` : undefined }} /><span>{file.name}</span><button onClick={() => setPhotos(current => current.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`}><X size={15} /></button></div>)}</div>}<p className="lfx-small-note">Photos remain in browser memory only. Use sample details when testing.</p></div>}
      {step === 2 && <div className="lfx-form-step lfx-review"><h3>A little closer to your next chapter.</h3><dl><div><dt>Space</dt><dd>{kind}</dd></div><div><dt>Services</dt><dd>{selected.join(", ")}</dd></div>{finish && <div><dt>Finish inspiration</dt><dd>{finish}</dd></div>}<div><dt>Name</dt><dd>{contact.name}</dd></div><div><dt>Email</dt><dd>{contact.email}</dd></div>{contact.city && <div><dt>City</dt><dd>{contact.city}</dd></div>}<div><dt>Photos selected locally</dt><dd>{photos.length}</dd></div></dl><p className="lfx-preview-note">Preview only. Completing this demonstration does not request an estimate or contact LayeredFX.</p></div>}
      <div className="lfx-dialog-actions"><Button variant="ghost" onClick={() => step ? setStep(current => current - 1) : onOpenChange(false)}><ArrowLeft size={16} />{step ? "Back" : "Cancel"}</Button>{step < 2 ? <Button onClick={next} disabled={step === 0 && !selected.length}>Continue <ArrowRight size={16} /></Button> : <Button onClick={() => setDone(true)}>Finish preview <Check size={16} /></Button>}</div>
    </> : <div className="lfx-preview-complete"><CheckCheck size={40} /><h3>Preview complete. No request was sent.</h3><p>Your selections are ready to review. You can export a local sample brief or close this window. A live estimate workflow will be connected in a later phase.</p><div className="lfx-dialog-actions"><Button variant="outline" onClick={exportBrief}><Download size={16} />Export sample brief</Button><Button onClick={() => onOpenChange(false)}>Done</Button></div></div>}
  </DialogContent></Dialog>;
}
