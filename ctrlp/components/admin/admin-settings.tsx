// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/admin/admin-settings.tsx
"use client";
import { Badge } from "@/ctrlp/components/ui/badge";
import { Button } from "@/ctrlp/components/ui/button";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/ctrlp/components/ui/card";
import { getCurrentAdminProfile,loadAdminDashboardData } from "@/ctrlp/lib/admin/admin-api";
import type { AdminDashboardData } from "@/ctrlp/lib/admin/types";
import { ROLE_PERMISSIONS } from "@/ctrlp/lib/rbac/permissions";
import { ROLES } from "@/ctrlp/lib/rbac/roles";
import { getSupabaseBrowserClient } from "@/ctrlp/lib/supabase/browser";
import { sourceFetch } from '@/lib/dashboard/source-runtime';
import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
type MessagingConfig = {
    twilio?: {
        configured: boolean;
        phoneNumber: string;
        webhookUrl?: string;
    };
    smtp?: {
        configured: boolean;
        host: string;
        port: string;
        from: string;
    };
    imap?: {
        configured: boolean;
        host: string;
        port: string;
        mailbox?: string;
    };
};
function human(value: string | null | undefined) {
    return String(value || "unknown").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
async function loadMessagingConfig(): Promise<MessagingConfig | null> {
    const db = getSupabaseBrowserClient();
    const session = db ? (await db.auth.getSession()).data.session : null;
    if (!session)
        return null;
    const response = await sourceFetch("/api/ctrlp/admin/messaging/config", { headers: { authorization: `Bearer ${session.access_token}` } });
    if (!response.ok)
        return null;
    return response.json();
}
async function handleSignOut() {
    const db = getSupabaseBrowserClient();
    if (db)
        await db.auth.signOut();
    window.location.href = "/login";
}
export function AdminSettings() {
    const pathname = usePathname();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [authState, setAuthState] = useState<"checking" | "allowed" | "denied">("checking");
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [config, setConfig] = useState<MessagingConfig | null>(null);
    const [query, setQuery] = useState("");
    useEffect(() => {
        async function boot() {
            const profile = await getCurrentAdminProfile();
            if (!profile && process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setAuthState("denied");
                return;
            }
            setAuthState("allowed");
            const [nextData, nextConfig] = await Promise.all([loadAdminDashboardData(), loadMessagingConfig()]);
            setData(nextData);
            setConfig(nextConfig);
        }
        boot();
    }, []);
    const users = data?.users ?? [];
    const orders = data?.orders ?? [];
    const payments = data?.payments ?? [];
    const messages = data?.messages ?? [];
    const activity = data?.activityLogs ?? [];
    const internalCount = users.filter((user) => ["super_admin", "admin", "employee", "staff", "production_manager", "installer", "customer_support"].includes(user.role)).length;
    const roleRows = Object.values(ROLES).filter((role) => role.toLowerCase().includes(query.toLowerCase().trim()) || !query.trim());
    return (<div className="source-module">
      <div className="min-h-full bg-background text-foreground">
        <></>
        <></>
        <main className="px-4 py-5  ">
          {authState === "checking" && <Card><CardContent className="p-5 text-sm text-muted-foreground">Checking admin access...</CardContent></Card>}
          {authState === "denied" && <Card className="border-red-500/30"><CardContent className="p-5"><div className="font-semibold text-red-600 dark:text-red-300">Admin access required</div><Button className="mt-4" asChild><a href="/login?redirect=/admin/settings">Go to login</a></Button></CardContent></Card>}
          {authState === "allowed" && <>
            <div className="mb-5"><h1 className="text-[25px] font-semibold tracking-tight">Settings command center</h1><p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">Review RBAC, integrations, notifications, billing, shipping, and operational readiness before adding the next user dashboards.</p></div>
            <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Stat label="Users" value={String(users.length)} hint="Accounts governed"/><Stat label="Internal" value={String(internalCount)} hint="Admin console roles"/><Stat label="Orders" value={String(orders.length)} hint="Workflow records"/><Stat label="Payments" value={String(payments.length)} hint="Billing records"/><Stat label="Messages" value={String(messages.length)} hint="Notification context"/></section>
            <section className="grid gap-4 xl:grid-cols-[1fr_420px]"><Card><CardHeader className="pb-3"><CardTitle className="text-base">Roles and permissions</CardTitle><CardDescription>Current app RBAC map used for dashboard routing and access checks.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{roleRows.map((role) => <div key={role} className="rounded-lg border bg-background/35 p-3"><div className="flex items-center justify-between"><div className="font-medium">{human(role)}</div><ShieldCheck className="h-4 w-4 text-primary"/></div><div className="mt-2 text-xs text-muted-foreground">{ROLE_PERMISSIONS[role]?.length || 0} permissions</div></div>)}</CardContent></Card><div className="space-y-4"><Card><CardHeader className="pb-3"><CardTitle className="text-base">Integration readiness</CardTitle></CardHeader><CardContent className="space-y-2"><ReadyRow title="Twilio SMS" detail={config?.twilio?.phoneNumber || "TWILIO_* env vars"} ready={Boolean(config?.twilio?.configured)}/><ReadyRow title="SMTP email" detail={`${config?.smtp?.host || "SMTP_HOST"}:${config?.smtp?.port || "465"}`} ready={Boolean(config?.smtp?.configured)}/><ReadyRow title="IMAP inbox" detail={`${config?.imap?.host || "IMAP_HOST"} / ${config?.imap?.mailbox || "INBOX"}`} ready={Boolean(config?.imap?.configured)}/><ReadyRow title="Square payments" detail="SQUARE_* env vars configured in Coolify" ready/><ReadyRow title="UPS / USPS" detail="UPS_* and USPS_* ready for live rate wiring" ready/></CardContent></Card><Card><CardHeader className="pb-3"><CardTitle className="text-base">Recent audit activity</CardTitle></CardHeader><CardContent className="space-y-2">{activity.slice(0, 8).map((item) => <div key={item.id} className="rounded-lg border bg-background/35 p-3"><div className="text-sm font-medium">{human(item.action)}</div><div className="text-xs text-muted-foreground">{human(item.entity_type)} - {new Date(item.created_at).toLocaleString()}</div></div>)}{!activity.length && <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No recent audit activity loaded.</div>}</CardContent></Card></div></section>
          </>}
        </main>
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
function ReadyRow({ title, detail, ready }: {
    title: string;
    detail: string;
    ready: boolean;
}) {
    return <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/35 p-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{title}</div><div className="truncate text-xs text-muted-foreground">{detail}</div></div><Badge className={ready ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}>{ready ? "Ready" : "Missing"}</Badge></div>;
}
