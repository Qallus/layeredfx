# LayeredFX supplied artwork

Original user-supplied assets are preserved here. Runtime copies are served from `/brand/` in `public/brand`; `lib/brand.ts` is the shared mapping. Dark/light filenames describe the background the artwork is intended for.

- Public header/footer use the light outline logo; the shared Logo component supports the dark outline variant with `inverted`.
- Dashboard sidebar uses the dark simple logo on its permanent dark surface, replaced by the app icon when collapsed. The top bar has no duplicate logo. Sign-in uses the light simple logo.
- Browser favicons select the supplied PNG by the browser's preferred color scheme. The web manifest uses the supplied SVG app icon.
- Both email PNGs are publicly available. `emailLogoUrl(siteUrl, background)` produces an absolute URL for email templates. No active email renderer or delivery provider exists to connect them to yet.

No supplied artwork was recolored or redrawn.
