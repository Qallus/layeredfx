# Authoritative additive integration scope

The preserved LayeredFX public website + the **entire CTRL+P dashboard and supporting functionality** + Channel Cast **Pipeline (all stage functionality), Workspace and Plans** form one LayeredFX application. The three existing modules are partial adaptations, not the complete dashboard.

This supersedes earlier instructions to selectively retain dashboard features, remove print infrastructure, launch a lightweight CRM, or treat the three Channel Cast modules as the whole backend. Unrelated security, design and development safeguards still apply. No source feature may be excluded without the user's approval.

Retain Orders, Projects (`/admin/production-schedule`), Production, Bookings, Designers, Payments, Messages, Communications, Customers, Users, Products, Wall Studio, Coupons, Artwork, Shipping, Marketing, Blog, Content, Agent, Settings, Analytics and overview, including customer routes, nested actions, provider integrations and scheduled jobs. A link or rendered page is not a completed migration.

Use one session, profile identity, authorization model, dashboard shell, theme and canonical customer/contact identity. Preserve stage IDs and history. A Project owns the overall customer job and commercial/scheduling context; multiple task-based Plans may extend it. The current won handoff does not replace CTRL+P Projects.

Source checkouts are read-only references. Never copy secrets, users, records, private files or consent. No remote push, live migration, communications, charge, deployment, DNS or Coolify action is authorized by this implementation work.

Implement in buildable increments with source commit/file evidence and honest status. The completion gate remains the full combined application. See the three parity/integration reports and `../reviews/current-review.md` for measured progress.
