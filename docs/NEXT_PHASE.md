> Authoritative scope correction: preserve the LayeredFX public website and migrate the COMPLETE CTRL+P dashboard, adding Channel Cast Pipeline, Workspace and Plans. Earlier selective-reuse, exclusion and lightweight-dashboard directions are superseded. Unrelated development and safety instructions remain. See docs/migration/SCOPE.md and docs/reviews/current-review.md.

> Current increment: Pipeline, Workspace and Plans source is now included. Start with `START_HERE.md` and `docs/channel-cast/`. The material below remains the earlier homepage map / broader roadmap, not an instruction to rebuild or discard the current dashboard.

# Next phase after homepage approval

## First: validate the delivered React application

Install dependencies and run the real Next.js build, lint, typecheck, and runtime tests. Confirm Radix behavior and the GPU material scene, not only the standalone HTML companion.

## Then: complete the public website

Create a structured service-detail template and pages for the ten services; add residential and commercial pages; replace concept inspiration with approved portfolio entries; and add About, Contact, FAQ, and the blog archive/detail templates. Keep the approved homepage design system.

## Then: connect a real estimate path

Implement a server-validated request endpoint, abuse prevention, private file storage, explicit success/failure states, duplicate handling, notifications, and a LayeredFX lead record. Do not route new leads into ControlP's production data by accident. Document retention and consent requirements for the actual workflow.

The current form validators are demonstration client-side checks. They are not a security boundary. A production upload pipeline requires independent server-side type/size inspection and access control.

## Then: reuse the ControlP foundation

Audit and adapt authentication, staff roles, contacts, booking, content management, and uploads. Give LayeredFX separate data and integration configuration. Do not assume a route directory proves that a feature is operational.

## Expand the Design Studio carefully

This package contains a selectable 3D material study, not photo masking or a complete room visualizer. Audit the existing `components/wall-studio/` implementation before porting its room-image upload, perspective manipulation, sizing, saved looks, or quote flow. Reuse the working visualizer where appropriate rather than inventing an AI segmentation system in the homepage phase.

## Finish: end-to-end launch review

Review real leads, private uploads, real bookings, notifications, staff authorization, content publication, SEO redirects, indexing, images, mobile behavior, accessibility, performance, and VPS rollback. Avoid launching demo success screens as live operational flows.
