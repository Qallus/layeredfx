> Authoritative scope correction: preserve the LayeredFX public website and migrate the COMPLETE CTRL+P dashboard, adding Channel Cast Pipeline, Workspace and Plans. Earlier selective-reuse, exclusion and lightweight-dashboard directions are superseded. Unrelated development and safety instructions remain. See docs/migration/SCOPE.md and docs/reviews/current-review.md.

> Current increment: Pipeline, Workspace and Plans source is now included. Start with `START_HERE.md` and `docs/channel-cast/`. The material below remains the earlier homepage map / broader roadmap, not an instruction to rebuild or discard the current dashboard.

# LayeredFX — Consolidated build roadmap

## Status and precedence

This is the product roadmap from the planning conversation, consolidated alongside the delivered homepage. It describes **future work as well as existing prototype functionality**. It is not an audit report and not proof that the backend exists.

The current delivered frontend is the starting point. Preserve its visual design unless Jeremy requests changes. Follow `CLAUDE.md`, `AGENTS.md`, `START_HERE.md`, and the actual source for immediate setup. Do not restart the homepage because an earlier plan began at Phase 0.

## Project mission

Rebuild LayeredFX.com as a premium, service-first website and service-management application, hosted on a separate Coolify application on Jeremy's VPS. Use the company-owned ControlP project as the complete internal dashboard foundation, preserving the service-first public website.

Source to inspect during the later reuse audit:

```text
https://github.com/ThePopOpp/ctrl-p.git
```

Target hosts are `layeredfx.com` and `www.layeredfx.com`; final canonical-host choice, redirects, deployment and DNS cutover require a separate reviewed launch step. Do not infer the current VPS IP from another project's documentation.

LayeredFX services:

- Residential and commercial wall wraps.
- Cabinet, countertop and appliance wraps.
- Wallpaper.
- Roman clay.
- Faux concrete overlays.
- Window tint / film.
- Interior and exterior painting.

Primary journey: **Discover → Get inspired → Visualize → Request estimate → Consultation → Project.** Do not force visitors into print-product cart/checkout workflows.

## What this package implements

A responsive homepage; proposed branding; all ten services grouped into four families; service and inspiration dialogs; an illustrative comparison slider; FAQs; a selectable Three.js material study; an explicitly non-submitting estimate preview; local photo previews; and a local project-brief export. See the source and QA notes for verification limits.

The material study is **not** the existing ControlP room-upload Wall Studio. This package does not include ControlP's repository, live authentication, CRM, booking engine, storage backend, vendor integrations, or production credentials.

## Isolation and reuse rules

Work only in LayeredFX's separate workspace and repository. Never push to ControlP or alter its live app while performing this conversion. Do not copy production `.env` files, real customer data, live sender settings, payment credentials, webhooks or jobs into this project.

Before backend reuse, inspect ControlP's actual package manifest and lockfile, routes, layouts, middleware, database migrations, authentication, authorization, UI primitives, booking, communications, content, uploads, dashboard, Wall Studio, Dockerfile and environment examples. Documentation may describe a different stack than the running code. Verify installed versions and security requirements before dependency changes; do not blindly upgrade, downgrade, or replace the working stack.

Create `docs/layeredfx/controlp-reuse-audit.md`. For every major module classify **Not migrated / In progress / Implemented, unverified / Verified locally / Requires external configuration / Source incomplete / Blocked**, provide file evidence, dependencies, implementation status, risks and migration order. A route directory alone does not prove a working feature. This audit file must be written from inspection; do not fabricate one from the roadmap.

Likely reuse candidates: UI primitives, data access patterns, verified authentication/roles, contacts, uploads, booking, content/blog, communications, dashboard structure, useful analytics, the room visualizer and deployment patterns.

Retain applicable print ecommerce, quantity pricing, vendor fulfillment through 4Over/B2Sign, cart/checkout, production queues and shipping workflows. Adapt them for LayeredFX and isolate provider configuration. No source capability is approved for exclusion.

Keep `docs/layeredfx/architecture-decisions.md` and `docs/layeredfx/migration-log.md` as actual decisions are made. Avoid a monorepo or shared multi-tenant platform rewrite during the first release.

## Design and frontend

Preserve the current warm architectural concept: generous whitespace, material texture, strong typography, restrained effects, thoughtful mobile layout and a distinct LayeredFX identity. Keep editable shadcn/Radix UI primitives and Three.js animation with reduced-motion and fallback behavior. Do not add a heavy animation/state library simply for convenience.

Use approved LayeredFX assets when available. Current illustration and finish labels are concepts. Never invent project photography, customer testimonials, business statistics, prices, product warranties, service areas, addresses, licenses, certifications or awards.

### Public navigation and page plan

Home; Services; Residential; Commercial; Projects; Design Studio; About; Blog / Resources; Contact. Primary CTA: **Get an Estimate**. Secondary CTA: **Book a Consultation**, only backed by actual booking or clearly labeled as a request.

Use one flexible service template, not ten unrelated page designs. Each service supports overview, application areas, benefits, material options, process, approved timeline/care information, related projects, FAQs, related services, estimate and applicable studio CTAs.

Proposed additional paths:

```text
/services
/services/wall-wraps
/services/cabinet-wraps
/services/countertop-wraps
/services/appliance-wraps
/services/wallpaper
/services/roman-clay
/services/faux-concrete
/services/window-film
/services/interior-painting
/services/exterior-painting
/residential
/commercial
/projects
/projects/[slug]
/design-studio
/estimate
/book
/about
/blog
/blog/[slug]
/contact
/faq
/privacy
/terms
```

These are planned paths, not all currently implemented. Keep one homepage route. When combining with ControlP, avoid conflicts between `app/page.tsx` and `app/(site)/page.tsx`; remove duplicate public chrome deliberately.

Homepage content families are Wrap & Resurface; Architectural Finishes; Glass & Film; and Paint. Use service imagery, before/after demonstrations, residential/commercial paths, process, material exploration, approved work and FAQs. Do not label concept illustrations as completed jobs.

## Design Studio evolution

Keep the delivered Three.js material explorer. Audit the ControlP `components/wall-studio/` implementation before adding room-upload visualization. Candidates from the planning inspection include StudioApp, VisualizerStage, VisualizerDrawer, PreviewControls, DesignSlider, DesignCard, SizeDialog, InstallQuoteSheet and BookingDialog; confirm their actual current paths and behavior.

Desired flow: upload/select a room → choose a surface → select material → position/scale/orient preview → request estimate with selected finish and authorized photo references retained. Start with reliable manual surface placement. Do not claim AI segmentation, photorealistic material accuracy or measurement precision that has not been implemented and tested.

Prepare for walls, cabinets, countertops, appliances, doors and furniture later without making all of them launch blockers. Lazy-load browser-only rendering; respect reduced motion and user pause; stop unnecessary offscreen/hidden-tab work; clean up textures, geometry, listeners and renderers.

## Estimate and booking workflow

Evolve the prototype into a short, adaptive request workflow. Collect residential/commercial type, one or more services, relevant dimensions/condition, optional photos, finish/inspiration, timing, optional budget, and contact/location/preferences. Make unknown measurements optional rather than blocking a lead.

Persist submissions server-side with validation, abuse prevention, duplicate/retry handling and explicit success/failure states. Store uploaded files privately with server-side type and size checks, authorized references and controlled retrieval. A browser file preview is not a server upload. Do not lose a persisted request just because a notification provider fails.

Keep customer quote requests separate from staff-authored estimates and approved projects. Final estimates need reviewed scope, material and labor details; do not reuse print margin rules as installed-service pricing.

Audit the existing booking system. Offer project consultation, on-site estimate, commercial consultation and material consultation as appropriate. A real booking needs a selectable date and time, a timezone, availability validation and conflict prevention. Until that exists, use an explicitly labeled appointment request rather than a false confirmed booking.

## Complete CTRL+P dashboard plus Channel Cast modules

Migrate every CTRL+P dashboard module and supporting action. Add Pipeline, Workspace and Plans to the same shell and identity model. See docs/migration/CTRL_P_DASHBOARD_PARITY.md for the source-backed inventory.

Suggested sales stages: New → Contacted → Consultation Scheduled → Measurements → Estimate Preparation → Estimate Sent → Follow-up → Approved / Won. Track Lost, Cancelled and Not Qualified separately. Conversion creates/links the project; project execution has its own status rather than treating all work as one lead row.

An initial project includes project number, contact, type, name, location, services, owner, related request/estimate/appointment, selections, notes, private files, before/progress/after photos, schedule, value and completion state. Role rules must be enforced on the server and in database/storage policy, not only the UI.

## Content and data design

Audit the existing schema before planning migrations. Likely entities: profiles; contacts; leads; services; lead-service relationships; estimate requests; estimates; estimate items; appointments; projects; project-service relationships; project media; project notes; materials; collections; saved studio looks; communications; blog posts; approved testimonials; and site content.

Use relations for core identities and links. JSON is appropriate for varying form details, not a replacement for the entire domain model. Keep vendor cost/internal notes private. Enable and test RLS and storage policies. Keep service-role credentials server-only. Prefer an independent LayeredFX Supabase project/instance and separate integration settings for straightforward isolation.

Materials can contain manufacturer/brand, collection, name/code, category, finish, texture, color family, preview files, approved applications and active/featured/studio-enabled flags. Do not automatically treat them as ecommerce products or invent availability.

A completed project may be published as a portfolio case study **only after an explicit publication review**. Link the public case study to the internal project but expose a dedicated allowlisted public representation. Never publish contact information, exact private addresses, internal notes or private uploads by returning the entire operational record.

Content supports draft/published states, service relevance, slugs, approved images, alt text and SEO metadata. Reuse verified blog/content modules rather than building a second competing editor.

## SEO, accessibility, performance and security

Use server-rendered meaningful public content, deliberate metadata, canonical hosts, sitemap/robots configuration, semantic markup, image optimization and accurate structured data. Keep the prototype noindex until content and real conversion paths are ready. Map actual old URLs before replacing the current site; do not fabricate a completed content migration.

Support keyboard/touch interaction, readable contrast, visible focus, correct labels, dialog focus restoration, mobile layouts and reduced motion. Test the actual application, not only the standalone HTML companion.

Review request validation, permissions, upload controls, rate limiting, secret handling, third-party scripts and inherited background work. SMS/email/marketing integrations remain disabled until LayeredFX-specific sender configuration, consent handling and operational testing are complete. No tool or API may be connected to ControlP production just to make a demo appear functional.

## Implementation order and acceptance

**Now — assemble and validate.** Use this consolidated source. Install packages, create the lockfile, typecheck, lint, run tests/build, and verify the actual React/Radix/Three.js runtime. Resolve defects without discarding the design.

**Next — public pages plus working intake.** Build the service template and remaining priority pages with approved content. In parallel, complete one dependable end-to-end path from estimate request to LayeredFX staff review. Do not postpone all real lead capture behind an advanced visualizer.

**Required — complete CTRL+P integration.** Produce the implementation-backed audit and adapt authentication, contacts, uploads, booking, content and dashboard modules as needed. Validate isolation before live integrations.

**Then — studio and operations expansion.** Port proven room visualization, saved selections, estimates and project workflow. Add materials and controlled portfolio publishing without delaying essential lead capture.

**Launch — staging then approved cutover.** Validate lead persistence, private uploads, real notifications/booking when enabled, staff permissions, content/metadata, mobile behavior, accessibility, health checks, Docker build and rollback. The included Dockerfile uses standalone output and port 3000 but still requires a real build/deployment test. Use separate Coolify application/environment settings. Preserve email DNS records when website traffic is moved.

For each phase record changed files, commands, real results, unresolved risks and next steps. Use Codex for a scoped review rather than having both agents rewrite the same files. Do not claim that a successful validator test proves a functioning CRM, correct permissions, live WebGL, or a deployable production app.
