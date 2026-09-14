# 3M DI-NOC Architectural Finishes — Pattern Swatch Pack

951 individual pattern swatches from the 3M™ DI-NOC™ Architectural Finishes
US/CA/EU Collection (2024). Extracted 2026-09-11.

## Structure
    swatches/                951 files, named <PATTERN-CODE>.jpg|.png
    di-noc-patterns.csv      manifest: code, series prefix, suffix, page, file, size, source
    catalog-pages/           86 page scans of the sample book, 1577x2264
    pdf/                     the official 2024 sample book PDF (85pp)

## Where these came from
3M does not publish DI-NOC patterns as a browsable product catalog. The category
page lists only 7 parent products, and the individual patterns exist only as
JS-loaded variant options. The pattern imagery lives in two places, both used here:

1. The official 2024 sample book PDF (multimedia.3m.com). Each printed swatch is a
   separately embedded JPEG, so 852 patterns were extracted at their native
   embedded resolution and matched to their printed pattern code by page geometry.
2. The `icata` interactive catalog viewer (3m.icata.net), which serves the same
   sample book as 86 page scans. Included whole as catalog-pages/.

## Sources per swatch (see the Source column)
- `embedded` (852) — lifted directly from the PDF as the original JPEG. Sizes vary
  by how large the swatch was printed, roughly 90x62 to 350x239 px.
- `rendered` (99) — the Solid Color (PS) series is drawn as vector fills rather than
  images, so these were rendered from the PDF at 300 dpi and edge-trimmed. The flat
  fill colour is also given as a hex value in the CSV.

## Series prefixes present
FW Fine Wood (174), WG Wood Grain (150), PS Solid Color (126), ME Metal (107),
AE Abstract (72), DW Dry Wood (70), ST Stone (44), PA (31), NU Textile (25),
FA (23), PW Premium Wood (22), VM (20), LE Leather (12), plus 23 smaller series.

## Suffixes
MT Matte Series · AR Abrasion Resistant · EX Exterior ·
PO E-Series PO Polyolefin · RC E-Series RC Recycled Content · TIL Tiled Design

## Known gaps
- PS-1441 could not be matched to a swatch region and is absent. 951 of the 952
  pattern codes printed in the book are present.
- 21 suffix variants (e.g. `-AR`, `-EX` versions of a pattern) share the base
  pattern's swatch in the book rather than being printed separately, so they are
  not separate files. The base pattern file is the correct image for them.
- Swatch resolution is limited by how large each was printed in the sample book.
  These are catalogue swatches, not seamless textures — for tileable material maps
  you would need the asset files from a 3M dealer.

## Rights
3M, DI-NOC and Comply are trademarks of 3M Company. Imagery is 3M's property,
taken from their publicly published sample book. Fine for internal specs and
mockups — check 3M's terms before anything client-facing.
