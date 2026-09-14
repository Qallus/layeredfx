# Wilsonart Design Library — Sample Pack

Scraped 2026-09-11 from wilsonart.com design libraries. 2,526 designs, 5,046 images.

## Structure
Each library folder contains:
- `swatches/`      — flat texture thumbnail (native preset, ~306px)
- `full-sheets/`   — full sheet render, 2000px wide (aspect varies by product)
- `<library>-designs.csv` — manifest for that library

`ALL-designs-master.csv` lists all 2,526 across every library.

Filenames are `<SKU>_<design-name>.jpg` and match across `swatches/` and `full-sheets/`.

## Libraries
| Folder | Product | Designs |
|---|---|---|
| hpl | High Pressure Laminate | 1187 |
| woodgrains | Wilsonart Woodgrains | 387 |
| compact-laminate | Compact Laminate Panels | 369 |
| tfl-panels | Thermally Fused Laminate | 328 |
| solid-surface | Solid Surface | 108 |
| quartz | Quartz | 74 |
| thinscape | Thinscape Composite Tops | 28 |
| wetwall | Wetwall Waterproof Panels | 24 |
| traceless | Traceless Ultra-Matte | 21 |

## Notes
- Full sheets normalized to the `PDP_HPL_FullSheet_5x12` asset preset, which returns
  2000px wide for every product type. Native presets were often much smaller
  (Solid Surface shipped at 550px). 2000px is the maximum the asset library exposes.
- 6 HPL designs have no full sheet — Wilsonart serves a no-image placeholder for
  Coal (3195), Fossil (3181), Ash (3192), Muslin (3130), Glacier (3170), Alaskan (3154).
  Their swatches are present.
- 22 Solid Surface entries are sinks, not sheets; they keep their native product photo.
- Images are Wilsonart LLC property. Fine for internal specs and mockups —
  check their Terms of Use before anything client-facing.
