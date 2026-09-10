// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/dashboard/customer-profile.tsx
"use client";
import { Button } from "@/ctrlp/components/ui/button";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/ctrlp/components/ui/card";
import { Input } from "@/ctrlp/components/ui/input";
import { getSupabaseBrowserClient } from "@/ctrlp/lib/supabase/browser";
import { sourceFetch } from '@/lib/dashboard/source-runtime';
import { BarChart3,Box,CalendarClock,Camera,CreditCard,FileCheck2,Home,IdCard,Mail,MessageSquare,Phone,Save,Settings,ShieldCheck,Truck,Upload,UserCircle,type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
type CustomerProfileData = {
    profile: {
        email: string | null;
        full_name: string | null;
        phone: string | null;
        company: string | null;
        profile_photo_url: string | null;
        role: string;
        status: string;
    };
};
const navItems: {
    label: string;
    icon: LucideIcon;
    href: string;
    active?: boolean;
}[] = [
    { label: "Overview", icon: Home, href: "/dashboard/customer" },
    { label: "Profile", icon: UserCircle, href: "/dashboard/customer/profile", active: true },
    { label: "Orders", icon: Box, href: "/dashboard/customer#orders" },
    { label: "Invoices", icon: CreditCard, href: "/dashboard/customer#invoices" },
    { label: "Artwork", icon: FileCheck2, href: "/dashboard/customer#artwork" },
    { label: "Bookings", icon: CalendarClock, href: "/dashboard/customer#bookings" },
    { label: "My Products", icon: IdCard, href: "/dashboard/customer/manage-products" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/customer/analytics" },
    { label: "Messages", icon: MessageSquare, href: "/dashboard/customer#messages" },
    { label: "Shipping", icon: Truck, href: "/dashboard/customer#shipping" },
    { label: "Settings", icon: Settings, href: "/dashboard/customer/settings" },
];
async function customerToken() {
    const db = getSupabaseBrowserClient();
    const session = db ? (await db.auth.getSession()).data.session : null;
    if (!session?.access_token)
        throw new Error("Sign in again before editing your profile.");
    return session.access_token;
}
export function CustomerProfile() {
    const router = useRouter();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [state, setState] = useState<"loading" | "ready" | "error">("loading");
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ full_name: "", phone: "", company: "", email: "", profile_photo_url: "" });
    const [mobileOpen, setMobileOpen] = useState(false);
    useEffect(() => {
        const storedTheme = window.localStorage.getItem("layeredfx_customer_theme");
        if (storedTheme === "light" || storedTheme === "dark")
            setTheme(storedTheme);
    }, []);
    useEffect(() => {
        async function load() {
            try {
                const token = await customerToken();
                const response = await sourceFetch("/api/ctrlp/dashboard/customer", { headers: { authorization: `Bearer ${token}` } });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok)
                    throw new Error(payload.error || "Could not load profile.");
                const profile = (payload as CustomerProfileData).profile;
                setForm({
                    full_name: profile.full_name || "",
                    phone: profile.phone || "",
                    company: profile.company || "",
                    email: profile.email || "",
                    profile_photo_url: profile.profile_photo_url || "",
                });
                setState("ready");
            }
            catch (error) {
                setMessage(error instanceof Error ? error.message : "Could not load profile.");
                setState("error");
            }
        }
        load();
    }, []);
    function toggleTheme() {
        setTheme((current) => {
            const next = current === "dark" ? "light" : "dark";
            window.localStorage.setItem("layeredfx_customer_theme", next);
            return next;
        });
    }
    async function save() {
        try {
            setMessage("");
            const token = await customerToken();
            const response = await sourceFetch("/api/ctrlp/dashboard/customer", {
                method: "PATCH",
                headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(payload.error || "Could not save profile.");
            setMessage("Profile saved.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not save profile.");
        }
    }
    async function uploadPhoto(file?: File) {
        if (!file)
            return;
        try {
            setUploading(true);
            setMessage("");
            const token = await customerToken();
            const body = new FormData();
            body.append("file", file);
            body.append("media_type", "customer-profile-photo");
            const response = await sourceFetch("/api/ctrlp/dashboard/customer/digital-cards/media", {
                method: "POST",
                headers: { authorization: `Bearer ${token}` },
                body,
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(payload.error || "Could not upload profile photo.");
            setForm((current) => ({ ...current, profile_photo_url: String(payload.publicUrl || "") }));
            setMessage("Profile photo uploaded. Save your profile to keep this change.");
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not upload profile photo.");
        }
        finally {
            setUploading(false);
        }
    }
    async function signOut() {
        const db = getSupabaseBrowserClient();
        await db?.auth.signOut();
        router.replace("/login");
    }
    return (<div className="source-module">
      <></>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (<div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)}/>)}

      {/* Mobile drawer */}
      <></>

      <></>
      <main className="">
        <section className="space-y-5 px-5 pb-5 pt-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-[25px] font-semibold tracking-tight">My Profile</h1>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">Keep your contact identity current for orders, invoices, proof approvals, shipping updates, and digital product workflows.</p>
            </div>
            {state === "ready" && <Button onClick={save}><Save className="h-4 w-4"/> Save profile</Button>}
          </div>
          {message && <div className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div>}
          {state === "loading" && <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading profile...</CardContent></Card>}
          {state === "error" && <Card><CardContent className="p-6 text-sm text-muted-foreground">{message || "Could not load profile."}</CardContent></Card>}
          {state === "ready" && (<>
              <section className="grid gap-4 xl:grid-cols-[420px_1fr]">
                <Card className="overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent"/>
                  <CardContent className="-mt-10 space-y-4 p-5">
                    <div className="flex items-end justify-between gap-4">
                      {form.profile_photo_url ? (<img className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-xl" src={form.profile_photo_url} alt=""/>) : (<div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-xl">{(form.full_name || form.email || "C").slice(0, 1).toUpperCase()}</div>)}
                      <div className="flex flex-wrap gap-2 pb-1">
                        <Button variant="outline" asChild disabled={uploading}>
                          <label className="cursor-pointer"><Upload className="h-4 w-4"/> {uploading ? "Uploading..." : "Upload"}<input type="file" accept="image/*" className="hidden" onChange={(event) => uploadPhoto(event.target.files?.[0])}/></label>
                        </Button>
                        <Button variant="outline" asChild disabled={uploading}>
                          <label className="cursor-pointer"><Camera className="h-4 w-4"/> Camera<input type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => uploadPhoto(event.target.files?.[0])}/></label>
                        </Button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{form.full_name || "Customer"}</div>
                      <div className="text-sm text-muted-foreground">{form.company || "LayeredFX customer"}</div>
                    </div>
                    <div className="grid gap-2">
                      <InfoRow icon={<Mail className="h-4 w-4"/>} label="Email" value={form.email || "Missing"}/>
                      <InfoRow icon={<Phone className="h-4 w-4"/>} label="Phone" value={form.phone || "Missing"}/>
                      <InfoRow icon={<ShieldCheck className="h-4 w-4"/>} label="Account" value="LayeredFX dashboard"/>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>This profile feeds invoices, proof updates, shipping notices, support messages, and managed digital products.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <Field label="Full name" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))}/>
                    <Field label="Company" value={form.company} onChange={(value) => setForm((current) => ({ ...current, company: value }))}/>
                    <Field label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))}/>
                    <Field label="Email" value={form.email} disabled onChange={() => undefined}/>
                    <div className="rounded-xl border bg-background/35 p-4 md:col-span-2">
                      <div className="text-sm font-medium">Profile photo usage</div>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">Your photo appears in the LayeredFX dashboard sidebar and can be reused later for digital products, support conversations, and customer-facing workflows.</p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <ProfileCard title="Orders and invoices" description="Used for order receipts, payment reminders, and invoice contact details."/>
                <ProfileCard title="Artwork and proofs" description="Used when designs, revisions, and approvals need customer confirmation."/>
                <ProfileCard title="Digital products" description="Used by business cards, QR pages, NFC products, forms, and future memberships."/>
              </section>
            </>)}
        </section>
      </main>
    </div>);
}
function CustomerSidebar({ active, profile, onSignOut }: {
    active: string;
    profile: {
        full_name: string;
        company: string;
        email: string;
        profile_photo_url: string;
    };
    onSignOut: () => void;
}) {
    return (<></>);
}
function Field({ label, value, disabled, onChange }: {
    label: string;
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (<label className="space-y-1 text-sm font-medium">
      <span className="text-muted-foreground">{label}</span>
      <Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}/>
    </label>);
}
function InfoRow({ icon, label, value }: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (<div className="flex items-center justify-between gap-3 rounded-xl border bg-background/35 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="min-w-0 truncate font-medium">{value}</div>
    </div>);
}
function ProfileCard({ title, description }: {
    title: string;
    description: string;
}) {
    return (<Card>
      <CardContent className="p-4">
        <div className="font-semibold">{title}</div>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>);
}
