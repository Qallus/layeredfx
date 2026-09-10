# Third-party notices

Dependencies are installed by npm and retain their own licenses. This source package does not bundle their distributions.

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

Pipeline, Workspace and Plans concepts and selected structures were reviewed from the owner-supplied `Qallus/Channel-Cast-OS` repository and adapted at the owner's request for LayeredFX. See `docs/channel-cast/SOURCE_MAP.md` for reviewed paths and blob IDs. This notice does not invent a public license for that repository. Confirm ownership/redistribution permissions when transferring source to third parties.

The new editor uses Plate and its basic-nodes/list/link/table packages. Existing shadcn/Radix/React/Next.js and Three.js notices still apply. Retain the package licenses supplied by the installed dependencies. No font files, source credentials or production data are bundled.
