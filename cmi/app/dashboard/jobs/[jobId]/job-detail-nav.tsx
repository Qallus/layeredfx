// Adapted from CMI 23320abb158e26f0945c2f1ce2f513f02649aa70: app/dashboard/jobs/[jobId]/job-detail-nav.tsx
"use client";

// Shared sub-navigation shown across a single job's pages. Summary / Info /
// Price Summary are live routes; the rest resolve to the [module] scaffold,
// which links out to existing features or shows "Coming soon."
import { useSidebar } from "@/cmi/components/dashboard/sidebar-context";
import { cn } from "@/cmi/lib/utils";
import Link from "next/link";
import * as React from "react";

const TABS: { slug: string; label: string; href: (id: string) => string }[] = [
  { slug: "summary", label: "Summary", href: (id) => `/admin/jobs/${id}/summary` },
  { slug: "info", label: "Job Info", href: (id) => `/admin/jobs/${id}/info` },
  { slug: "price-summary", label: "Price Summary", href: (id) => `/admin/jobs/${id}/price-summary` },
  { slug: "client-portal", label: "Client Portal", href: (id) => `/admin/jobs/${id}/client-portal` },
  { slug: "schedule", label: "Schedule", href: (id) => `/admin/jobs/${id}/schedule` },
  { slug: "projects", label: "Projects & Tasks", href: (id) => `/admin/jobs/${id}/projects` },
  { slug: "documents", label: "Documents", href: (id) => `/admin/jobs/${id}/documents` },
  { slug: "files", label: "Files", href: (id) => `/admin/jobs/${id}/files` },
  { slug: "messages", label: "Messages", href: (id) => `/admin/jobs/${id}/messages` },
  { slug: "communications", label: "Communications", href: (id) => `/admin/jobs/${id}/communications` },
  { slug: "change-orders", label: "Change Orders", href: (id) => `/admin/jobs/${id}/change-orders` },
  { slug: "invoices", label: "Invoices", href: (id) => `/admin/jobs/${id}/invoices` },
  { slug: "selections", label: "Selections", href: (id) => `/admin/jobs/${id}/selections` },
  { slug: "warranty", label: "Warranty", href: (id) => `/admin/jobs/${id}/warranty` },
  { slug: "notes", label: "Notes", href: (id) => `/admin/jobs/${id}/notes` },
  { slug: "activity", label: "Activity", href: (id) => `/admin/jobs/${id}/activity` },
];

// Single-row job header: back-to-all-jobs (left), the scrollable tab menu
// (center), and an optional action such as "Edit Job Info" (right).
export function JobDetailNav({ jobId, active, action }: { jobId: string; active: string; action?: React.ReactNode }) {
  const { collapsed } = useSidebar();

  // Horizontal bar — the default, and the mobile layout even when collapsed.
  const horizontal = (
    <div className="flex items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <Link href="/admin/jobs" className="shrink-0 whitespace-nowrap text-sm text-muted-foreground transition hover:text-foreground">
        ← All jobs
      </Link>
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.slug}
            href={t.href(jobId)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition",
              active === t.slug ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  if (!collapsed) return horizontal;

  // Collapsed (job pages): a fixed vertical rail on desktop — out of document
  // flow so every page's content renders normally (the layout pads content left
  // to clear it). Mobile keeps the horizontal bar.
  return (
    <>
      <nav className="fixed bottom-0 left-[76px] top-14 z-30 hidden w-52 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border px-3 py-3">
          <Link href="/admin/jobs" className="text-sm text-muted-foreground transition hover:text-foreground">← All jobs</Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {TABS.map((t) => (
            <Link
              key={t.slug}
              href={t.href(jobId)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition",
                active === t.slug ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {action ? <div className="border-t border-border p-2">{action}</div> : null}
      </nav>
      <div className="lg:hidden">{horizontal}</div>
    </>
  );
}
