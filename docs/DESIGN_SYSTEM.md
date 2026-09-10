# Homepage design system

## Proposed direction

A service-first architectural brand: warm ivory, restrained olive, charcoal, natural material tones, generous space, large editorial typography, and modest rounded corners.

These are proposal tokens, not an assertion about the existing LayeredFX brand:

```css
--lfx-paper: #f6f5f0;
--lfx-ink: #292d25;
--lfx-olive: #777c64;
--lfx-clay: #b68160;
--lfx-muted: #707365;
--lfx-line: #dcdfd3;
```

System sans-serif typography pairs with an italic Georgia accent. No font files are shipped. Replace with approved, properly licensed brand fonts as desired.

## Homepage narrative

Hero → service families → interactive finish studio → inspiration → illustrative comparison → process → FAQ → estimate CTA.

Headline: **Same space. A whole new feeling.**

Service families cover all user-supplied services:

- Wrap & resurface: wall, cabinet, countertop, and appliance wraps.
- Architectural finishes: wallpaper, Roman clay, and faux concrete overlays.
- Window tint & film.
- Interior and exterior painting.

## Component conventions

The visual tokens and layout live in `components/layeredfx/layeredfx.css`. Interactive primitives live under `components/layeredfx/ui`. Update shared styles rather than copying a second design for each service.

## Motion

The actual Three.js material scene uses layered sample panels, procedural texture maps, lighting, a low-amplitude floating movement, and pointer-sensitive rotation. Finish changes update the front material. Users can pause the scene. Respect the OS reduced-motion preference and do not keep rendering while the section or browser tab is hidden.

Do not turn this into an effects-heavy demo at the expense of service discovery. The conversion actions remain ordinary accessible HTML controls.

## Mobile

The hero stacks. The service families use a compact two-column grid, inspiration becomes one column, the material scene stacks below its controls, and navigation becomes a Sheet. Verify at 360, 390, 768, 1024, and 1440 pixels before approving future changes.
