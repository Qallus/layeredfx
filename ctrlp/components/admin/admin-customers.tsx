// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/admin/admin-customers.tsx
"use client";
import { Badge } from "@/ctrlp/components/ui/badge";
import { Button } from "@/ctrlp/components/ui/button";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/ctrlp/components/ui/card";
import { Input } from "@/ctrlp/components/ui/input";
import { Sheet,SheetContent,SheetDescription,SheetHeader,SheetTitle } from "@/ctrlp/components/ui/sheet";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/ctrlp/components/ui/table";
import { getCurrentAdminProfile,loadAdminDashboardData,updateAdminUser } from "@/ctrlp/lib/admin/admin-api";
import type { AdminDashboardData,AdminProfile,AdminUser } from "@/ctrlp/lib/admin/types";
import { ROLES } from "@/ctrlp/lib/rbac/roles";
import { getSupabaseBrowserClient } from "@/ctrlp/lib/supabase/browser";
import { sourceFetch } from '@/lib/dashboard/source-runtime';
import { Mail,Phone,UserRoundPlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect,useMemo,useState } from "react";
function human(value: string | null | undefined) {
    return String(value || "unknown").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function initials(value: string | null | undefined) {
    return String(value || "CP").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
function formatDate(value: string | null | undefined) {
    if (!value)
        return "Not available";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
async function adminToken() {
    const db = getSupabaseBrowserClient();
    const session = db ? (await db.auth.getSession()).data.session : null;
    if (!session?.access_token)
        throw new Error("Sign in again before managing customers.");
    return session.access_token;
}
async function handleSignOut() {
    const db = getSupabaseBrowserClient();
    if (db)
        await db.auth.signOut();
    window.location.href = "/login";
}
export function AdminCustomers() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [authState, setAuthState] = useState<"checking" | "allowed" | "denied">("checking");
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [query, setQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<AdminUser | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    useEffect(() => {
        async function boot() {
            const currentProfile = await getCurrentAdminProfile();
            if (!currentProfile && process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setAuthState("denied");
                return;
            }
            setProfile(currentProfile);
            setAuthState("allowed");
            setData(await loadAdminDashboardData());
        }
        boot();
    }, []);
    async function refresh(openCustomerId?: string) {
        const nextData = await loadAdminDashboardData();
        setData(nextData);
        if (openCustomerId)
            setSelectedCustomer(nextData.users.find((user) => user.id === openCustomerId) ?? null);
    }
    const users = data?.users ?? [];
    const orders = data?.orders ?? [];
    const payments = data?.payments ?? [];
    const messages = data?.messages ?? [];
    const customers = users.filter((user) => user.role === ROLES.CUSTOMER);
    const visibleCustomers = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return customers.filter((customer) => !needle || [customer.full_name, customer.email, customer.phone, customer.company].some((value) => String(value || "").toLowerCase().includes(needle)));
    }, [customers, query]);
    const smsReady = customers.filter((customer) => customer.phone);
    const emailReady = customers.filter((customer) => customer.email);
    const orderLinked = customers.filter((customer) => orders.some((order) => order.user_id === customer.id || order.customer_email === customer.email));
    return (<div className="source-module">
      <div className="min-h-full bg-background text-foreground">
        <></>

        <></>

        <main className="px-4 py-5  ">
          {authState === "checking" && <Card><CardContent className="p-5 text-sm text-muted-foreground">Checking admin access...</CardContent></Card>}
          {authState === "denied" && <Card className="border-red-500/30"><CardContent className="p-5"><div className="font-semibold text-red-600 dark:text-red-300">Admin access required</div><Button className="mt-4" asChild><a href="/login?redirect=/admin/customers">Go to login</a></Button></CardContent></Card>}
          {authState === "allowed" && <>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h1 className="text-[25px] font-semibold tracking-tight">Customer command center</h1><p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">Create and manage customer profiles with required phone numbers for SMS, payment links, shipping updates, artwork reviews, and order communication.</p></div><Button onClick={() => setAddOpen(true)}><UserRoundPlus className="h-4 w-4"/> Add customer</Button></div>
            <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Stat label="Customers" value={String(customers.length)} hint="Customer role accounts"/><Stat label="SMS ready" value={`${smsReady.length}/${customers.length}`} hint="Phone numbers on file"/><Stat label="Email ready" value={`${emailReady.length}/${customers.length}`} hint="Email addresses on file"/><Stat label="Order linked" value={String(orderLinked.length)} hint="Connected to orders"/></section>
            <Card><CardHeader className="pb-3"><CardTitle className="text-base">Customer directory</CardTitle><CardDescription>Click a customer to update contact details used across messages, orders, payments, artwork, and shipping.</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead className="pl-4">Customer</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>Company</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Orders</TableHead></TableRow></TableHeader><TableBody>{visibleCustomers.map((customer) => <TableRow key={customer.id} className="cursor-pointer" onClick={() => setSelectedCustomer(customer)}><TableCell className="pl-4"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-[11px] font-semibold">{initials(customer.full_name || customer.email)}</div><div><div className="font-medium">{customer.full_name || customer.email || "Unnamed customer"}</div><div className="text-xs text-muted-foreground">Created {formatDate(customer.created_at)}</div></div></div></TableCell><TableCell>{customer.phone || <span className="text-red-600 dark:text-red-300">Missing</span>}</TableCell><TableCell>{customer.email || "Missing"}</TableCell><TableCell>{customer.company || "Not set"}</TableCell><TableCell><Badge variant="outline">{human(customer.status)}</Badge></TableCell><TableCell className="text-right">{orders.filter((order) => order.user_id === customer.id || order.customer_email === customer.email).length}</TableCell></TableRow>)}{!visibleCustomers.length && <TableRow><TableCell colSpan={6} className="p-6 text-center text-muted-foreground">No matching customers.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
          </>}
        </main>

        <CustomerSheet customer={selectedCustomer} open={Boolean(selectedCustomer)} onOpenChange={(open) => !open && setSelectedCustomer(null)} onRefresh={refresh} orders={orders}/>
        <AddCustomerSheet open={addOpen} onOpenChange={setAddOpen} onCreated={refresh} profile={profile}/>
      </div>
    </div>);
}
function Stat({ label, value, hint }: {
    label: string;
    value: string;
    hint: string;
}) {
    return <Card><CardContent className="p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-2 text-[22px] font-semibold leading-none">{value}</div><div className="mt-2 text-[11px] text-muted-foreground">{hint}</div></CardContent></Card>;
}
function CustomerSheet({ customer, open, onOpenChange, onRefresh, orders }: {
    customer: AdminUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRefresh: (openCustomerId?: string) => Promise<void>;
    orders: AdminDashboardData["orders"];
}) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [company, setCompany] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    useEffect(() => {
        if (!customer)
            return;
        setFullName(customer.full_name || "");
        setEmail(customer.email || "");
        setPhone(customer.phone || "");
        setCompany(customer.company || "");
        setMessage("");
    }, [customer]);
    if (!customer)
        return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent /></Sheet>;
    const customerOrders = orders.filter((order) => order.user_id === customer.id || order.customer_email === customer.email);
    const canSave = fullName.trim().length >= 2 && email.trim().includes("@") && phone.trim().length >= 7 && !saving;
    async function save() {
        const activeCustomer = customer;
        if (!activeCustomer)
            return;
        setSaving(true);
        setMessage("Saving customer...");
        try {
            await updateAdminUser(activeCustomer.id, { role: ROLES.CUSTOMER, status: activeCustomer.status, full_name: fullName, email, phone, company });
            setMessage("Customer saved.");
            await onRefresh(activeCustomer.id);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not save customer.");
        }
        finally {
            setSaving(false);
        }
    }
    return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="overflow-y-auto sm:max-w-[60rem]"><SheetHeader><SheetTitle>{customer.full_name || customer.email || "Customer"}</SheetTitle><SheetDescription>Customer contact profile and connected orders.</SheetDescription></SheetHeader><div className="mt-6 space-y-5"><div className="grid gap-3 sm:grid-cols-2"><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Full name</div><Input value={fullName} onChange={(event) => setFullName(event.target.value)}/></div><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Email</div><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)}/></div><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Phone number</div><Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)}/></div><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Company</div><Input value={company} onChange={(event) => setCompany(event.target.value)}/></div></div><div className="rounded-lg border bg-secondary/30 p-3 text-sm text-muted-foreground"><Phone className="mr-2 inline h-4 w-4"/>This phone number powers SMS campaigns, payment links, proof notifications, order updates, and shipping tracking.</div>{message && <div className="rounded-lg border bg-background/35 p-3 text-sm text-muted-foreground">{message}</div>}<Button className="w-full" disabled={!canSave} onClick={save}>{saving ? "Saving..." : "Save customer"}</Button><Card><CardHeader className="pb-3"><CardTitle className="text-base">Connected orders</CardTitle><CardDescription>{customerOrders.length} orders linked by customer id or email.</CardDescription></CardHeader><CardContent className="space-y-2">{customerOrders.slice(0, 8).map((order) => <div key={order.id} className="flex items-center justify-between rounded-lg border bg-background/35 p-3 text-sm"><div><div className="font-medium">{order.order_number || order.id.slice(0, 8)}</div><div className="text-xs text-muted-foreground">{human(order.status)} - {human(order.payment_status)}</div></div><Badge variant="outline">{order.total ? `$${Number(order.total).toFixed(2)}` : "$0.00"}</Badge></div>)}{!customerOrders.length && <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No orders connected yet.</div>}</CardContent></Card></div></SheetContent></Sheet>;
}
function AddCustomerSheet({ open, onOpenChange, onCreated, profile }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => Promise<void>;
    profile: AdminProfile | null;
}) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [company, setCompany] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const canSubmit = fullName.trim().length >= 2 && email.trim().includes("@") && phone.trim().length >= 7 && !saving;
    async function createCustomer(sendInvite: boolean) {
        setSaving(true);
        setMessage(sendInvite ? "Creating customer and sending invite..." : "Creating customer...");
        try {
            if (!profile)
                throw new Error("Admin session is required.");
            const token = await adminToken();
            const response = await sourceFetch("/api/ctrlp/admin/users", {
                method: "POST",
                headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
                body: JSON.stringify({ full_name: fullName, email, phone, company, role: ROLES.CUSTOMER, status: "active", send_invite: sendInvite }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok)
                throw new Error(payload.error || "Could not create customer.");
            setFullName("");
            setEmail("");
            setPhone("");
            setCompany("");
            setMessage(sendInvite ? "Customer invite sent." : "Customer created.");
            await onCreated();
            onOpenChange(false);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : "Could not create customer.");
        }
        finally {
            setSaving(false);
        }
    }
    return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="overflow-y-auto sm:max-w-[60rem]"><SheetHeader><SheetTitle>Add customer</SheetTitle><SheetDescription>Create a customer profile with required phone and email communication fields.</SheetDescription></SheetHeader><div className="mt-6 space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Full name</div><Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jane Customer"/></div><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Email</div><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@example.com"/></div><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Phone number</div><Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+14805550123"/></div><div><div className="mb-1.5 text-xs font-medium text-muted-foreground">Company</div><Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company or organization"/></div></div><div className="rounded-lg border bg-secondary/30 p-3 text-sm text-muted-foreground"><Mail className="mr-2 inline h-4 w-4"/><Phone className="mr-2 inline h-4 w-4"/>Customer email and phone are required so Marketing, Messages, Orders, Payments, Artwork, and Shipping can all reach the same contact record.</div>{message && <div className="rounded-lg border bg-background/35 p-3 text-sm text-muted-foreground">{message}</div>}<div className="flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={!canSubmit} onClick={() => createCustomer(false)}>{saving ? "Creating..." : "Create customer"}</Button><Button className="flex-1" variant="outline" disabled={!canSubmit} onClick={() => createCustomer(true)}>Create and invite</Button><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button></div></div></SheetContent></Sheet>;
}
