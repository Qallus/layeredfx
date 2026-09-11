# Third-party notices

## CTRL+P dashboard adaptation

Coupon management fields, validation and workflows are adapted from the user-supplied `ThePopOpp/ctrl-p` repository at `015a7b58b80e63ef87c73bec549a23242b88f3e3`, especially `components/admin/admin-coupons.tsx`, `app/api/admin/coupons/route.ts` and its initial schema. Source attribution and remaining feature gaps are recorded in `docs/migration/CTRL_P_DASHBOARD_PARITY.md`. No source credentials or production records were imported. Existing source/dependency licenses remain applicable.

Dependencies are installed by npm and retain their own licenses. This source package does not bundle their distributions.

The dashboard client screens and their dependencies under `ctrlp/` are also adapted from that CTRL+P commit. The source file manifest and page-level boundaries are recorded in `docs/migration/ported-client-files.json` and `docs/migration/DASHBOARD_PAGES.md`.

## CMI Jobs adaptation

The Jobs clients and supporting components under `cmi/` are adapted from the user-supplied `Qallus/cmi` repository at `23320abb158e26f0945c2f1ce2f513f02649aa70`. See `docs/migration/cmi-client-files.json` for the source paths. No source credentials or production records were imported. This attribution does not assign a new license to the source repository; existing source and dependency notices remain applicable.

## UI and dependency notices

The UI uses shadcn/ui's source-component approach with Radix primitives, CVA variants, and a `cn` utility. The button composition follows the user-owned ControlP source and established shadcn/ui conventions. The components are customized and namespaced for LayeredFX.

shadcn/ui is distributed under the MIT License. Keep applicable notices when copying or modifying its component source:

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Three.js, React, Next.js, Radix, Lucide, and other dependencies retain their own project notices. The standalone preview optionally loads Three.js from a CDN; the Next.js application loads the npm-installed package.

No font files are distributed. The local SVG interior illustrations are concept assets, not third-party project photography.


## Channel Cast-derived operations adaptation

Contacts, phone/vCard import and the dashboard floating action layout are adapted from `Qallus/Channel-Cast-OS` commit `8cd1de0a6c3aacd2da08b0544a29e9df5a6044cf`. Selected pure parser/model code is under `lib/channelcast/`; no source seed contacts were imported. See `docs/migration/CONTACTS_AND_FAB.md` for reviewed source paths, integration behavior and remaining limits. Twilio server/client SDKs retain their package licenses.

Pipeline, Workspace and Plans concepts and selected structures were reviewed from the owner-supplied `Qallus/Channel-Cast-OS` repository and adapted at the owner's request for LayeredFX. See `docs/channel-cast/SOURCE_MAP.md` for reviewed paths and blob IDs. This notice does not invent a public license for that repository. Confirm ownership/redistribution permissions when transferring source to third parties.

The new editor uses Plate and its basic-nodes/list/link/table packages. Existing shadcn/Radix/React/Next.js and Three.js notices still apply. Retain the package licenses supplied by the installed dependencies. No font files, source credentials or production data are bundled.
# Portal login layout reference

The LayeredFX portal login and registration split layout was informed by CTRL+P `app/login/page.tsx` at commit `015a7b58b80e63ef87c73bec549a23242b88f3e3` and the owner's supplied screenshot. New portal UI, copy and account boundaries were implemented for LayeredFX. No CTRL+P testimonials, customer metrics, credentials or account data were copied. See `docs/migration/PORTALS.md` for scope and verification.

Frontend Contact and booking entry: layout reference from CTRL+P contact/booking components at 015a7b58b80e63ef87c73bec549a23242b88f3e3 and user-supplied screenshots. LayeredFX copy, request flow and styling adapted for this application; no source business details or records copied.

Wall Studio: `lib/studio/homography.ts`, textured-triangle drawing in `lib/studio/triangle.ts`, and demo room SVG in `lib/studio/demo.ts` adapted from CTRL+P commit 015a7b58b80e63ef87c73bec549a23242b88f3e3. Source homography comments credit the Franklin Ta adjugate method. Booking card/calendar and studio workflow reference the same source and supplied screenshots.

Wall Studio automatic foreground selection uses Hugging Face Transformers.js (Apache-2.0) and Xenova/slimsam-77-uniform ONNX model weights (Apache-2.0), downloaded by the browser on first use. Model source: https://huggingface.co/Xenova/slimsam-77-uniform. Original model: https://github.com/czg1225/SlimSAM.

Wilsonart vendor swatches are reproduced for the requested vendor material library. Wilsonart retains its trademarks and image rights. Exact product and image source URLs are recorded in lib/studio/wilsonart.json; verified 2026-09-11. These are screen previews, not physical color samples or a claim of installation suitability. No prices or availability are imported.
