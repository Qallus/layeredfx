> Historical homepage-only verification. For the current Pipeline / Workspace / Plans increment, read `docs/channel-cast/QA_REPORT.md`. These original preview tests do not validate the new dashboard.

# Verification report — 10 September 2026

## Executed

**26/26 standalone-preview browser checks passed** in Chromium. The preview was inserted into a browser page and tested at desktop and mobile sizes. Checks covered service filters, details, material selection, finish carry-through, validation, local photo handling, review, explicit non-submission, JSON export, inspiration filters, comparison interaction, FAQ expansion, mobile navigation, and horizontal overflow.

Widths checked: 360, 375, 390, 768, 1024, 1440, and 1920 pixels.

**6/6 pure input-validation unit tests passed** using Node's built-in test runner.

**26 TypeScript/TSX files passed syntax transpilation** using TypeScript's `transpileModule`. This is a syntax check, not a dependency-backed typecheck.

Screenshot files show the standalone HTML companion. The material study in these captures is its CSS fallback. They do not prove that the actual Three.js WebGL renderer ran.

## Not executed

- Dependency installation from npm.
- Full TypeScript type checking against React, Next.js, Radix, and Three.js packages.
- ESLint with the installed project dependencies.
- Next.js development-server execution or production compilation.
- The live Three.js WebGL scene and real Radix component runtime.
- Docker build or Coolify deployment.
- Backend, email, SMS, booking, payment, auth, or Supabase tests; these are not connected in this deliverable.

Outbound package downloads and file navigation were blocked in this environment. The HTML was tested through browser content injection. No successful build/deployment claim is made.

## Required local verification

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Confirm that the material studio gets `data-three-status="ready"`, responds to pointer movement and swatches, pauses, respects reduced motion, and recovers to a fallback when WebGL is unavailable. Test focus trapping/restoration in the actual Radix dialogs and Sheet. Test the standalone `preview/index.html` by opening it directly in your target browser as well.

The JSON export includes only a sample brief and selected photo names, not image bytes. No backend receives form content in this prototype.
