// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/admin/admin-designers.tsx
"use client";
import { Badge } from "@/ctrlp/components/ui/badge";
import { Button } from "@/ctrlp/components/ui/button";
import { Card,CardContent } from "@/ctrlp/components/ui/card";
import { Input } from "@/ctrlp/components/ui/input";
import { Sheet,SheetContent,SheetHeader,SheetTitle } from "@/ctrlp/components/ui/sheet";
import { Textarea } from "@/ctrlp/components/ui/textarea";
import { getCurrentAdminProfile,loadAdminDashboardData } from "@/ctrlp/lib/admin/admin-api";
import type { AdminDashboardData } from "@/ctrlp/lib/admin/types";
import { getSupabaseBrowserClient } from "@/ctrlp/lib/supabase/browser";
import { cn } from "@/ctrlp/lib/utils";
import { sourceFetch } from '@/lib/dashboard/source-runtime';
import { CalendarDays,Check,DollarSign,Loader2,Pencil,Plus,Trash2,User,X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect,useMemo,useState } from "react";
// ─── Types ────────────────────────────────────────────────────────────────────
type DaySchedule = {
    enabled: boolean;
    start: string;
    end: string;
};
type WeeklySchedule = Record<string, DaySchedule>;
type Designer = {
    id: string;
    name: string;
    title: string;
    bio: string | null;
    avatar_url: string | null;
    hourly_rate: number;
    specialties: string[];
    is_active: boolean;
    weekly_schedule: WeeklySchedule;
    sort_order: number;
    created_at: string;
};
type DesignerBooking = {
    id: string;
    status: string;
    start_time: string;
    end_time: string;
    total_price: number;
    customer_first_name: string;
    customer_last_name: string;
    customer_email: string;
};
const DAYS: {
    key: string;
    label: string;
}[] = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
];
const DEFAULT_SCHEDULE: WeeklySchedule = {
    mon: { enabled: true, start: "09:00", end: "17:00" },
    tue: { enabled: true, start: "09:00", end: "17:00" },
    wed: { enabled: true, start: "09:00", end: "17:00" },
    thu: { enabled: true, start: "09:00", end: "17:00" },
    fri: { enabled: true, start: "09:00", end: "16:00" },
    sat: { enabled: false, start: "09:00", end: "13:00" },
    sun: { enabled: false, start: "09:00", end: "13:00" },
};
const BOOKING_STATUS_COLORS: Record<string, string> = {
    pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-200",
    confirmed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
    in_progress: "bg-blue-500/15 text-blue-700 dark:text-blue-200",
    completed: "bg-secondary text-secondary-foreground",
    canceled: "bg-red-500/15 text-red-700 dark:text-red-200",
    rescheduled: "bg-secondary text-secondary-foreground",
    no_show: "bg-red-500/15 text-red-700 dark:text-red-200",
};
function human(s: string) {
    return s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
function fmtMoney(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
function fmtDate(s: string) {
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Phoenix",
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    }).format(new Date(s));
}
// ─── Auth helpers ─────────────────────────────────────────────────────────────
async function adminFetch(path: string, init?: RequestInit) {
    const db = getSupabaseBrowserClient();
    const session = await db?.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token)
        throw new Error("Sign in to continue.");
    const res = await sourceFetch(path, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
        },
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(payload.error ?? "Request failed.");
    return payload;
}
async function handleSignOut() {
    const db = getSupabaseBrowserClient();
    if (db)
        await db.auth.signOut();
    window.location.href = "/login";
}
// ─── Designer form ────────────────────────────────────────────────────────────
function DesignerForm({ initial, onSave, onCancel, saving, }: {
    initial?: Designer | null;
    onSave: (data: Partial<Designer>) => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [title, setTitle] = useState(initial?.title ?? "Graphic Designer");
    const [bio, setBio] = useState(initial?.bio ?? "");
    const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url ?? "");
    const [hourlyRate, setHourlyRate] = useState(String(initial?.hourly_rate ?? 100));
    const [specialtiesStr, setSpecialtiesStr] = useState((initial?.specialties ?? []).join(", "));
    const [isActive, setIsActive] = useState(initial?.is_active !== false);
    const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 100));
    const [schedule, setSchedule] = useState<WeeklySchedule>(initial?.weekly_schedule ?? DEFAULT_SCHEDULE);
    function handleScheduleChange(dayKey: string, field: keyof DaySchedule, value: string | boolean) {
        setSchedule((prev) => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value },
        }));
    }
    function handleSubmit() {
        if (!name.trim())
            return;
        onSave({
            name: name.trim(),
            title: title.trim() || "Graphic Designer",
            bio: bio.trim() || null,
            avatar_url: avatarUrl.trim() || null,
            hourly_rate: Math.max(0, Number(hourlyRate) || 100),
            specialties: specialtiesStr.split(",").map((s) => s.trim()).filter(Boolean),
            is_active: isActive,
            weekly_schedule: schedule,
            sort_order: Number(sortOrder) || 100,
        });
    }
    return (<div className="space-y-5 p-1">
      {/* Basic info */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Full name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith"/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Job title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Graphic Designer"/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Bio</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short description shown to customers when booking…" rows={3} className="resize-none"/>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Avatar URL</label>
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…"/>
        </div>
      </div>

      {/* Rate */}
      <div className="rounded-xl border bg-secondary/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <DollarSign className="h-4 w-4"/>
          Hourly Rate
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-muted-foreground">$</span>
          <Input type="number" min={0} step={5} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-28 text-lg font-bold"/>
          <span className="text-sm text-muted-foreground">/ hour</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          This rate is locked in at the time of booking and shown to customers during checkout.
        </p>
      </div>

      {/* Specialties */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Specialties <span className="font-normal">(comma-separated)</span>
        </label>
        <Input value={specialtiesStr} onChange={(e) => setSpecialtiesStr(e.target.value)} placeholder="Banners, Signs, Vehicle Wraps, Logos"/>
      </div>

      {/* Availability schedule */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4"/>
          Weekly Availability
        </div>
        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key] ?? { enabled: false, start: "09:00", end: "17:00" };
            return (<div key={key} className="flex items-center gap-3">
                <button onClick={() => handleScheduleChange(key, "enabled", !day.enabled)} className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors", day.enabled ? "border-primary bg-primary" : "border-border")}>
                  {day.enabled && <Check className="h-3 w-3 text-primary-foreground"/>}
                </button>
                <span className={cn("w-24 text-xs font-medium", !day.enabled && "text-muted-foreground")}>
                  {label}
                </span>
                {day.enabled ? (<div className="flex items-center gap-1.5">
                    <input type="time" value={day.start} onChange={(e) => handleScheduleChange(key, "start", e.target.value)} className="h-7 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"/>
                    <span className="text-xs text-muted-foreground">to</span>
                    <input type="time" value={day.end} onChange={(e) => handleScheduleChange(key, "end", e.target.value)} className="h-7 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"/>
                  </div>) : (<span className="text-xs text-muted-foreground">Unavailable</span>)}
              </div>);
        })}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsActive(!isActive)} className={cn("flex h-5 w-5 items-center justify-center rounded border-2 transition-colors", isActive ? "border-primary bg-primary" : "border-border")}>
            {isActive && <Check className="h-3 w-3 text-primary-foreground"/>}
          </button>
          <label className="text-sm">Active (visible to customers)</label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Sort order</label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="h-7 w-16 text-xs"/>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" disabled={saving || !name.trim()} onClick={handleSubmit}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving…</> : "Save designer"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>);
}
// ─── Main component ───────────────────────────────────────────────────────────
export function AdminDesigners() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [authState, setAuthState] = useState<"checking" | "allowed" | "denied">("checking");
    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
    const [designers, setDesigners] = useState<Designer[]>([]);
    const [bookings, setBookings] = useState<(DesignerBooking & {
        designer_profiles?: {
            name: string;
        };
    })[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<Designer | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [view, setView] = useState<"roster" | "bookings">("roster");
    const orders = dashboardData?.orders ?? [];
    const payments = dashboardData?.payments ?? [];
    const messages = dashboardData?.messages ?? [];
    const users = dashboardData?.users ?? [];
    async function load() {
        const profile = await getCurrentAdminProfile();
        if (!profile && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            setAuthState("denied");
            return;
        }
        setAuthState("allowed");
        setDashboardData(await loadAdminDashboardData());
        setLoading(true);
        try {
            const [dRes, bRes] = await Promise.all([
                adminFetch("/api/ctrlp/admin/designers?all=true"),
                sourceFetch("/api/ctrlp/designer-bookings?limit=100").then((r) => r.json()),
            ]);
            setDesigners(dRes.designers ?? []);
            setBookings(bRes.bookings ?? []);
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : "Failed to load.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    async function handleSave(data: Partial<Designer>) {
        setSaving(true);
        setMessage("");
        try {
            if (editing) {
                await adminFetch("/api/ctrlp/admin/designers", {
                    method: "PATCH",
                    body: JSON.stringify({ id: editing.id, ...data }),
                });
                setMessage("Designer updated.");
            }
            else {
                await adminFetch("/api/ctrlp/admin/designers", {
                    method: "POST",
                    body: JSON.stringify(data),
                });
                setMessage("Designer created.");
            }
            setSheetOpen(false);
            setEditing(null);
            await load();
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : "Save failed.");
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDelete(designer: Designer) {
        if (!window.confirm(`Deactivate "${designer.name}"? They won't appear to new customers.`))
            return;
        try {
            await adminFetch(`/api/admin/designers?id=${encodeURIComponent(designer.id)}`, { method: "DELETE" });
            setMessage("Designer deactivated.");
            await load();
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : "Delete failed.");
        }
    }
    function openCreate() {
        setEditing(null);
        setSheetOpen(true);
    }
    function openEdit(d: Designer) {
        setEditing(d);
        setSheetOpen(true);
    }
    const filteredDesigners = useMemo(() => {
        if (!search)
            return designers;
        const q = search.toLowerCase();
        return designers.filter((d) => d.name.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            d.specialties.some((s) => s.toLowerCase().includes(q)));
    }, [designers, search]);
    const stats = useMemo(() => {
        const active = designers.filter((d) => d.is_active).length;
        const pending = bookings.filter((b) => b.status === "pending_payment").length;
        const confirmed = bookings.filter((b) => b.status === "confirmed").length;
        const revenue = bookings
            .filter((b) => ["confirmed", "completed"].includes(b.status))
            .reduce((s, b) => s + Number(b.total_price), 0);
        return [
            { label: "Active designers", value: String(active) },
            { label: "Pending sessions", value: String(pending), hint: "Awaiting payment" },
            { label: "Confirmed sessions", value: String(confirmed) },
            { label: "Session revenue", value: fmtMoney(revenue), hint: "Confirmed + completed" },
        ];
    }, [designers, bookings]);
    return (<div className="source-module">
      <div className="min-h-full bg-background text-foreground">
        {/* ── Sidebar ── */}
        <></>

        {/* ── Header ── */}
        <></>

        {/* ── Main ── */}
        <main className="px-4 py-5  ">
          {authState === "checking" && (<Card><CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Checking admin access…</CardContent></Card>)}
          {authState === "denied" && (<Card className="border-red-500/30">
              <CardContent className="p-5">
                <div className="font-semibold text-red-600 dark:text-red-300">Admin access required</div>
                <Button className="mt-4" asChild><a href="/login?redirect=/admin/designers">Go to login</a></Button>
              </CardContent>
            </Card>)}

          {authState === "allowed" && (<>
              {/* Title row */}
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-[25px] font-semibold tracking-tight">Designers</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your designer roster, hourly rates, availability, and session bookings.
                  </p>
                </div>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4"/>
                  Add designer
                </Button>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((s) => (<Card key={s.label}>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                      {s.hint && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{s.hint}</div>}
                    </CardContent>
                  </Card>))}
              </div>

              {/* Tabs */}
              <div className="mb-5 flex gap-1 border-b">
                {(["roster", "bookings"] as const).map((v) => (<button key={v} onClick={() => setView(v)} className={cn("px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors", view === v
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground")}>
                    {v === "roster" ? "Designer Roster" : "Session Bookings"}
                    {v === "bookings" && bookings.length > 0 && (<Badge className="ml-2 h-4 bg-primary/20 px-1.5 text-[10px] text-foreground">
                        {bookings.length}
                      </Badge>)}
                  </button>))}
              </div>

              {message && (<div className="mb-4 flex items-center justify-between rounded-lg border bg-secondary/50 px-4 py-2 text-sm">
                  {message}
                  <button onClick={() => setMessage("")}><X className="h-4 w-4 text-muted-foreground"/></button>
                </div>)}

              {loading && (<div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin"/>
                  Loading…
                </div>)}

              {/* ── Roster view ── */}
              {!loading && view === "roster" && (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredDesigners.length === 0 && (<div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                      No designers yet.{" "}
                      <button onClick={openCreate} className="underline hover:text-foreground">
                        Add your first designer
                      </button>
                    </div>)}
                  {filteredDesigners.map((d) => (<Card key={d.id} className={cn(!d.is_active && "opacity-60")}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          {d.avatar_url ? (<img src={d.avatar_url} alt={d.name} className="h-12 w-12 shrink-0 rounded-full object-cover"/>) : (<div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                              <User className="h-5 w-5"/>
                            </div>)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold truncate">{d.name}</span>
                              {!d.is_active && (<Badge className="shrink-0 bg-secondary text-secondary-foreground text-[10px]">Inactive</Badge>)}
                            </div>
                            <div className="text-xs text-muted-foreground">{d.title}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-bold">{fmtMoney(Number(d.hourly_rate))}</div>
                            <div className="text-[11px] text-muted-foreground">/ hour</div>
                          </div>
                        </div>

                        {d.specialties.length > 0 && (<div className="mt-3 flex flex-wrap gap-1">
                            {d.specialties.map((s) => (<span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                                {s}
                              </span>))}
                          </div>)}

                        {/* Availability summary */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {DAYS.map(({ key, label }) => {
                        const day = d.weekly_schedule?.[key];
                        return (<span key={key} title={day?.enabled ? `${day.start}–${day.end}` : "Unavailable"} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", day?.enabled
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-secondary text-muted-foreground")}>
                                {label.slice(0, 3)}
                              </span>);
                    })}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(d)}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5"/>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(d)}>
                            <Trash2 className="h-3.5 w-3.5"/>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>))}
                </div>)}

              {/* ── Bookings view ── */}
              {!loading && view === "bookings" && (<div className="space-y-3">
                  {bookings.length === 0 && (<div className="py-10 text-center text-sm text-muted-foreground">No session bookings yet.</div>)}
                  {bookings.map((b) => (<Card key={b.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {b.customer_first_name} {b.customer_last_name}
                              </span>
                              <Badge className={cn("text-[10px]", BOOKING_STATUS_COLORS[b.status] ?? "bg-secondary text-secondary-foreground")}>
                                {human(b.status)}
                              </Badge>
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{b.customer_email}</div>
                            {b.designer_profiles && (<div className="mt-0.5 text-xs text-muted-foreground">
                                Designer: <span className="font-medium text-foreground">{b.designer_profiles.name}</span>
                              </div>)}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-bold">{fmtMoney(Number(b.total_price))}</div>
                            <div className="text-xs text-muted-foreground">{fmtDate(b.start_time)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>))}
                </div>)}
            </>)}
        </main>
      </div>

      {/* ── Edit / Create sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="mb-5">
            <SheetTitle>{editing ? `Edit — ${editing.name}` : "Add designer"}</SheetTitle>
          </SheetHeader>
          <DesignerForm initial={editing} onSave={handleSave} onCancel={() => { setSheetOpen(false); setEditing(null); }} saving={saving}/>
        </SheetContent>
      </Sheet>
    </div>);
}
