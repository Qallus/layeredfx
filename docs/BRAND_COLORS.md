# LayeredFX — Brand Colors

Reference for all color decisions in the LFX app. Colors are derived from the logo: ink navy `#19202E` and volt lime `#D6FF41`.

**Rule for Claude Code:** never introduce a hex value that isn't in this file. If a UI need isn't covered here, pick the closest existing token and say so.

---

## 1. Core

| Name | Hex | oklch | Role |
|---|---|---|---|
| Ink navy | `#19202E` | `oklch(0.2435 0.0288 263.81)` | Primary brand color, dark surfaces, body text |
| Volt lime | `#D6FF41` | `oklch(0.9392 0.2071 121.44)` | Accent only — CTAs, highlights, active states |
| Paper | `#FFFFFF` | `oklch(1 0 0)` | Light surface |

Volt is an accent, not a background. Target roughly 60% neutral / 30% ink / 10% volt on any given screen.

---

## 2. Ink scale (neutrals)

| Token | Hex | oklch |
|---|---|---|
| `ink-950` | `#0E121B` | `oklch(0.1826 0.0196 265.90)` |
| `ink-900` | `#19202E` | `oklch(0.2435 0.0288 263.81)` |
| `ink-800` | `#232C3D` | `oklch(0.2926 0.0337 262.82)` |
| `ink-700` | `#2A3346` | `oklch(0.3214 0.0363 264.79)` |
| `ink-600` | `#47536B` | `oklch(0.4417 0.0426 263.99)` |
| `ink-400` | `#8A93A6` | `oklch(0.6623 0.0301 265.35)` |
| `ink-200` | `#C9CED8` | `oklch(0.8505 0.0149 264.49)` |
| `ink-100` | `#EEF1F5` | `oklch(0.9570 0.0063 255.48)` |
| `ink-50`  | `#F7F9FB` | `oklch(0.9812 0.0034 247.86)` |

All neutrals are hue-matched to the logo navy (~264°). Do not mix in Tailwind's default `slate` / `gray` — they drift warm/cool against these.

---

## 3. Volt scale

| Token | Hex | oklch | Use |
|---|---|---|---|
| `volt-800` | `#63790D` | `oklch(0.5393 0.1259 121.72)` | Lime-colored **text** on light backgrounds (only shade that passes AA) |
| `volt-700` | `#7C9A12` | `oklch(0.6405 0.1517 122.69)` | Hover/pressed state for volt fills, large text, icons |
| `volt-600` | `#AEDB22` | `oklch(0.8298 0.1974 123.66)` | Secondary fills, borders, dark-mode links |
| `volt-500` | `#D6FF41` | `oklch(0.9392 0.2071 121.44)` | **Base brand accent** — primary buttons, active nav, focus rings |
| `volt-300` | `#E7FF8C` | `oklch(0.9583 0.1429 118.86)` | Tints, chart fills, selected rows |
| `volt-100` | `#F5FFCC` | `oklch(0.9799 0.0667 116.66)` | Subtle backgrounds, badge fills |

---

## 4. Accents & status

| Token | Hex | oklch | Use |
|---|---|---|---|
| `ember` | `#FF6B2C` | `oklch(0.7038 0.1946 40.92)` | Secondary accent — use sparingly, never adjacent to volt at full size |
| `success` | `#1F9D64` | `oklch(0.6167 0.1363 157.61)` | Confirmations. Note: volt is *not* a success color |
| `warning` | `#E0A415` | `oklch(0.7558 0.1521 81.40)` | Warnings |
| `danger` | `#D63B30` | `oklch(0.5837 0.1936 28.63)` | Destructive actions, errors |
| `info` | `#2E7CC4` | `oklch(0.5741 0.1342 249.96)` | Informational states |

---

## 5. Contrast rules (WCAG AA)

Measured ratios, do not guess:

- `volt-500` on white = **1.15:1** → never use volt as text on a light background.
- `volt-500` on `ink-900` = **14.17:1** → excellent. This is the signature pairing.
- Text **on** a volt-500 fill must be `ink-900` (14.17:1). Never white text on volt.
- `volt-800` on white = **4.92:1** → the only lime that passes AA for body text on light.
- `volt-700` on white = 3.24:1 → large text (18pt+/24px) and icons only.
- `ink-400` on white = 3.09:1 → placeholder and disabled text only, never body copy.
- `ink-600` on white = 7.73:1 → safe for secondary text.

Focus rings: `volt-500` at 2px with a 2px offset. On light backgrounds add a 1px `ink-900` outer ring so the ring stays visible.

---

## 6. shadcn/ui token mapping

Drop into `app/globals.css`. Tailwind v4 + shadcn CSS-variable convention.

```css
:root {
  --radius: 0.625rem;

  --background: oklch(1 0 0);
  --foreground: oklch(0.2435 0.0288 263.81);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2435 0.0288 263.81);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2435 0.0288 263.81);

  --primary: oklch(0.9392 0.2071 121.44);
  --primary-foreground: oklch(0.2435 0.0288 263.81);

  --secondary: oklch(0.2435 0.0288 263.81);
  --secondary-foreground: oklch(1 0 0);

  --muted: oklch(0.9570 0.0063 255.48);
  --muted-foreground: oklch(0.4417 0.0426 263.99);

  --accent: oklch(0.9799 0.0667 116.66);
  --accent-foreground: oklch(0.5393 0.1259 121.72);

  --destructive: oklch(0.5837 0.1936 28.63);
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.8505 0.0149 264.49);
  --input: oklch(0.8505 0.0149 264.49);
  --ring: oklch(0.9392 0.2071 121.44);

  --chart-1: oklch(0.9392 0.2071 121.44);
  --chart-2: oklch(0.2435 0.0288 263.81);
  --chart-3: oklch(0.6405 0.1517 122.69);
  --chart-4: oklch(0.7038 0.1946 40.92);
  --chart-5: oklch(0.6623 0.0301 265.35);
}

.dark {
  --background: oklch(0.1826 0.0196 265.90);
  --foreground: oklch(0.9570 0.0063 255.48);

  --card: oklch(0.2435 0.0288 263.81);
  --card-foreground: oklch(0.9570 0.0063 255.48);
  --popover: oklch(0.2435 0.0288 263.81);
  --popover-foreground: oklch(0.9570 0.0063 255.48);

  --primary: oklch(0.9392 0.2071 121.44);
  --primary-foreground: oklch(0.1826 0.0196 265.90);

  --secondary: oklch(0.3214 0.0363 264.79);
  --secondary-foreground: oklch(0.9570 0.0063 255.48);

  --muted: oklch(0.2926 0.0337 262.82);
  --muted-foreground: oklch(0.6623 0.0301 265.35);

  --accent: oklch(0.3214 0.0363 264.79);
  --accent-foreground: oklch(0.9392 0.2071 121.44);

  --destructive: oklch(0.5837 0.1936 28.63);
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.3214 0.0363 264.79);
  --input: oklch(0.3214 0.0363 264.79);
  --ring: oklch(0.9392 0.2071 121.44);

  --chart-1: oklch(0.9392 0.2071 121.44);
  --chart-2: oklch(0.8298 0.1974 123.66);
  --chart-3: oklch(0.7038 0.1946 40.92);
  --chart-4: oklch(0.6623 0.0301 265.35);
  --chart-5: oklch(0.5741 0.1342 249.96);
}
```

---

## 7. Tailwind v4 theme

Add alongside the block above so raw scale steps are available as utilities (`bg-volt-500`, `text-ink-600`, etc.).

```css
@theme inline {
  --color-ink-50: oklch(0.9812 0.0034 247.86);
  --color-ink-100: oklch(0.9570 0.0063 255.48);
  --color-ink-200: oklch(0.8505 0.0149 264.49);
  --color-ink-400: oklch(0.6623 0.0301 265.35);
  --color-ink-600: oklch(0.4417 0.0426 263.99);
  --color-ink-700: oklch(0.3214 0.0363 264.79);
  --color-ink-800: oklch(0.2926 0.0337 262.82);
  --color-ink-900: oklch(0.2435 0.0288 263.81);
  --color-ink-950: oklch(0.1826 0.0196 265.90);

  --color-volt-100: oklch(0.9799 0.0667 116.66);
  --color-volt-300: oklch(0.9583 0.1429 118.86);
  --color-volt-500: oklch(0.9392 0.2071 121.44);
  --color-volt-600: oklch(0.8298 0.1974 123.66);
  --color-volt-700: oklch(0.6405 0.1517 122.69);
  --color-volt-800: oklch(0.5393 0.1259 121.72);

  --color-ember: oklch(0.7038 0.1946 40.92);
  --color-success: oklch(0.6167 0.1363 157.61);
  --color-warning: oklch(0.7558 0.1521 81.40);
  --color-danger: oklch(0.5837 0.1936 28.63);
  --color-info: oklch(0.5741 0.1342 249.96);
}
```

---

## 8. Component conventions

- **Primary button:** `volt-500` fill, `ink-900` text, `volt-600` on hover.
- **Secondary button:** `ink-900` fill, white text, `ink-700` on hover.
- **Ghost/tertiary:** transparent, `ink-600` text, `ink-100` hover fill.
- **Links (light bg):** `ink-900` with a `volt-500` underline; `volt-800` on hover.
- **Links (dark bg):** `volt-500`.
- **Cards:** white on `ink-50` page background; `ink-200` 1px border, no shadow-heavy treatment.
- **Dark sections:** `ink-950` background, `ink-100` body text, volt for anything interactive.
- **Three.js / hero scenes:** `ink-950` background, volt emissive/highlight material, `ember` only as a rare secondary light. No third hue.

---

## 9. Logo usage

| File | Background |
|---|---|
| `LayeredFX_Logo_Email_Light.webp` (dark wordmark) | white / `ink-50` / `ink-100` |
| `LayeredFX_logo_dark_outline_email.png` (white wordmark) | `ink-900` / `ink-950` / photography |
| `LayeredFX_favicon_light.png` | favicon, app icon, avatar slots |

Never place the logo on a volt-colored background — the lime in the mark disappears. Minimum clear space around the mark equals the height of the "X" glyph.
