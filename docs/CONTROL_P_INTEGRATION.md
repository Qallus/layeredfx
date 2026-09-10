> Authoritative scope correction: preserve the LayeredFX public website and migrate the COMPLETE CTRL+P dashboard, adding Channel Cast Pipeline, Workspace and Plans. Earlier selective-reuse, exclusion and lightweight-dashboard directions are superseded. Unrelated development and safety instructions remain. See docs/migration/SCOPE.md and docs/reviews/current-review.md.

# Safe integration with a LayeredFX copy of ControlP

## Recommended first step: run standalone

The easiest way to review this homepage is to open the extracted starter in its own VS Code folder and run it as documented. Do not overwrite ControlP's package, root layout, existing globals, database configuration, or authentication while evaluating a design.

## What was actually reused

The new frontend follows the actual ControlP package's Next.js/React/TypeScript/Tailwind stack and its Radix + CVA + `cn` button composition. It uses its established App Router approach but builds a new LayeredFX public UX. Three.js is new.

This ZIP does **not** contain ControlP's source repository or its backend. A reviewed merge is still required. No remote files were changed.

Source files inspected for this handoff:

- `ThePopOpp/ctrl-p/package.json` — blob `a2094e42af115680065cae4672b38225dcd6129b`.
- `ThePopOpp/ctrl-p/components/ui/button.tsx` — blob `d21dd84c912596d5d834e80c7cebac557e10db2c`.
- `ThePopOpp/ctrl-p/app/(site)/layout.tsx` — blob `34ea891840abbe95c9ffd82de1f74168010a4159`.

The source site layout renders its own `SiteNav` and `SiteFooter`. Putting the whole LayeredFX homepage inside that layout without changing the chrome would show two headers and two footers.

## Add a preview route to a separate LayeredFX checkout

Work only in a separate LayeredFX repository/checkout. Review `git status` and `git remote -v` first. Create a checkpoint before editing. Confirm the destination GitHub repository before pushing anything.

Copy these directories from the starter into that checkout:

```text
components/layeredfx/
lib/layeredfx/
```

Merge the image assets intentionally. To avoid clashing with existing files, place the supplied image files under a new directory such as `public/layeredfx-images/`, and update the `/images/...` references only in the LayeredFX component/data files to `/layeredfx-images/...`.

Do not overwrite existing images by filename without checking them.

Create `app/layeredfx-preview/page.tsx` **outside** the existing `(site)` route group:

```tsx
import type { Metadata } from "next";
import { LayeredFXHome } from "@/components/layeredfx/home-page";
import "@/components/layeredfx/layeredfx.css";

export const metadata: Metadata = {
  title: "LayeredFX — Homepage Preview",
  robots: { index: false, follow: false },
};

export default function LayeredFXPreviewPage() {
  return <LayeredFXHome />;
}
```

This creates `/layeredfx-preview`. The existing root layout still applies. Inspect it for global ControlP branding, injected widgets, auth providers, PWA registration, or production integration side effects. The supplied standalone root avoids these dependencies, while your existing root may not.

## Dependency merge — do not replace the source package

Compare the two package files. Add only missing dependencies. The source already declares most shared packages. The relevant additions for this frontend are:

```bash
npm install three@^0.186.0 @radix-ui/react-slider@^1.3.6
npm install -D @types/three@^0.185.0
```

Verify the installed React/Radix versions and their compatibility. Retain the source package manager and lockfile. This starter's Next.js minimum is a patched 15.x release, not a request to downgrade or indiscriminately upgrade an existing working application. Audit the actual installed versions and current security notices.

The Tailwind content scan must include `./components/**/*.{ts,tsx}`. Existing shadcn semantic colors should map to the CSS variables provided under `.lfx`. The main styling is namespaced so it does not restyle unrelated ControlP UI.

Do not overwrite ControlP's `components.json`. Its existing shadcn configuration may be needed elsewhere. The namespaced primitives in this package are regular component source files and can be imported directly.

## Promote the design after approval

In the separate LayeredFX repository, replace the intended homepage route and its public chrome deliberately. Do not create both `app/page.tsx` and `app/(site)/page.tsx` for `/`; they conflict.

Keep one source of the navigation and footer. Update LayeredFX metadata, favicon, canonical domain, and public assets. Review or disable inherited ControlP background jobs, commerce routes, tracking, vendor calls, messaging, and PWA cache identifiers.

## Later backend reuse

Audit ControlP's authentication, users, contacts, booking, content, storage, and Wall Studio. Migrate all verified dashboard modules and their dependencies. The material explorer in this package is a finish-study scene; it is **not** a port of ControlP's full uploaded-room visualizer.

LayeredFX needs independent environment variables and a separate Supabase project/instance for the simplest isolation. Do not connect these preview forms to ControlP production tables. Do not share service-role credentials or live outbound integrations across the two businesses by default.
