// Adapted from CTRL+P 015a7b58b80e63ef87c73bec549a23242b88f3e3: components/admin/admin-section-page.tsx
"use client";
import { Button } from "@/ctrlp/components/ui/button";
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from "@/ctrlp/components/ui/card";
import { getCurrentAdminProfile,loadAdminDashboardData } from "@/ctrlp/lib/admin/admin-api";
import { adminSectionConfigs } from "@/ctrlp/lib/admin/section-configs";
import type { AdminDashboardData } from "@/ctrlp/lib/admin/types";
import { getSupabaseBrowserClient } from "@/ctrlp/lib/supabase/browser";
import { usePathname } from "next/navigation";
import { ReactNode,useEffect,useState } from "react";
async function handleSignOut() {
    const db = getSupabaseBrowserClient();
    if (db)
        await db.auth.signOut();
    window.location.href = "/login";
}
export function AdminSectionPage({ section }: {
    section: keyof typeof adminSectionConfigs;
}) {
    const config = adminSectionConfigs[section];
    const pathname = usePathname();
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [authState, setAuthState] = useState<"checking" | "allowed" | "denied">("checking");
    const [data, setData] = useState<AdminDashboardData | null>(null);
    useEffect(() => {
        async function boot() {
            const profile = await getCurrentAdminProfile();
            if (!profile && process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setAuthState("denied");
                return;
            }
            setAuthState("allowed");
            setData(await loadAdminDashboardData());
        }
        boot();
    }, []);
    const orders = data?.orders ?? [];
    const payments = data?.payments ?? [];
    const messages = data?.messages ?? [];
    const users = data?.users ?? [];
    const stats = data ? config.stats(data) : [];
    return (<div className="source-module">
      <div className="min-h-full bg-background text-foreground">
        <></>

        <></>

        <main className="px-4 py-5  ">
          {authState === "checking" && <Card><CardContent className="p-5 text-sm text-muted-foreground">Checking admin access...</CardContent></Card>}
          {authState === "denied" && (<Card className="border-red-500/30">
              <CardContent className="p-5">
                <div className="font-semibold text-red-600 dark:text-red-300">Admin access required</div>
                <p className="mt-2 text-sm text-muted-foreground">Sign in with an active staff or admin account before opening this admin section.</p>
                <Button className="mt-4" asChild><a href={`/login?redirect=${pathname}`}>Go to login</a></Button>
              </CardContent>
            </Card>)}
          {authState === "allowed" && (<>
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-[25px] font-semibold tracking-tight">{config.title}</h1>
                  <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{config.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button>{config.primaryAction}</Button>
                  <Button variant="outline">{config.secondaryAction}</Button>
                </div>
              </div>

              <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {stats.map((stat) => <StatCard key={stat.label} {...stat}/>)}
              </section>

              <section className="grid gap-4 xl:grid-cols-3">
                {config.panels.map((panel) => (<WorkflowCard key={panel.title} title={panel.title} description={panel.description}>
                    {panel.items.map((item) => (<div key={item} className="rounded-lg border bg-background/35 px-3 py-2 text-sm">{item}</div>))}
                  </WorkflowCard>))}
              </section>
            </>)}
        </main>
      </div>
    </div>);
}
function StatCard({ label, value, hint }: {
    label: string;
    value: string;
    hint: string;
}) {
    return (<Card>
      <CardContent className="p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 text-[22px] font-semibold leading-none">{value}</div>
        <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>);
}
function WorkflowCard({ title, description, children }: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (<Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>);
}
