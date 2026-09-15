// Generates the illustrative wall-finish textures used by /labs/wall-wrap.
// Run: node scripts/build-wall-finishes.mjs → public/images/wall-wrap/finishes/*.webp (sized to the wall mask).
// These are procedural material impressions, not photos of installed LayeredFX work.
import {mkdirSync} from 'node:fs';
import sharp from 'sharp';

const W = 1926, H = 1057, OUT = 'public/images/wall-wrap/finishes';
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255);
const svg = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;
const layer = (filter, opacity = 1) => `<rect width="${W}" height="${H}" filter="url(#${filter})" opacity="${opacity}"/>`;

/** Noise mapped onto a dark → light color ramp; `stretch` raises contrast around the midpoint. */
function noise(id, {freq, octaves = 4, seed = 1, dark, light, stretch = 2, type = 'fractalNoise'}) {
  const [r0, g0, b0] = hex(dark), [r1, g1, b1] = hex(light);
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="${type}" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}"/>
    <feComponentTransfer><feFuncR type="linear" slope="${stretch}" intercept="${0.5 - stretch / 2}"/></feComponentTransfer>
    <feColorMatrix type="matrix" values="${r1 - r0} 0 0 0 ${r0}  ${g1 - g0} 0 0 0 ${g0}  ${b1 - b0} 0 0 0 ${b0}  0 0 0 0 1"/>
  </filter>`;
}

/** Thin dark veins where turbulence is close to zero. */
function veins(id, {freq, seed, color, strength, octaves = 4}) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="turbulence" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}"/>
    <feColorMatrix type="matrix" values="0 0 0 0 ${hex(color)[0]}  0 0 0 0 ${hex(color)[1]}  0 0 0 0 ${hex(color)[2]}  -1 0 0 0 1"/>
    <feComponentTransfer><feFuncA type="table" tableValues="${'0 '.repeat(20)}${strength * 0.15} ${strength * 0.45} ${strength * 0.8} ${strength}"/></feComponentTransfer>
    <feGaussianBlur stdDeviation="0.9"/>
  </filter>`;
}

function concrete() {
  const defs = noise('mottle', {freq: 0.0026, octaves: 5, seed: 3, dark: '#8b8781', light: '#bdb8b0', stretch: 2.4})
    + noise('grain', {freq: 0.75, octaves: 2, seed: 5, dark: '#5f5c58', light: '#dcd7cf', stretch: 2.6})
    + noise('stain', {freq: '0.0012 0.004', octaves: 3, seed: 12, dark: '#6d6a65', light: '#c4bfb7', stretch: 2});
  const cols = 4, rows = 2, pw = W / cols, ph = H / rows;
  let seams = '', holes = '';
  for (let c = 1; c < cols; c++) seams += `<rect x="${c * pw - 2}" width="4" height="${H}" fill="#6f6b66" opacity=".55"/><rect x="${c * pw + 2}" width="2" height="${H}" fill="#d8d3cb" opacity=".35"/>`;
  for (let r = 1; r < rows; r++) seams += `<rect y="${r * ph - 2}" width="${W}" height="4" fill="#6f6b66" opacity=".55"/><rect y="${r * ph + 2}" width="${W}" height="2" fill="#d8d3cb" opacity=".35"/>`;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) for (const fx of [0.25, 0.75]) for (const fy of [0.25, 0.75]) {
    const x = (c + fx) * pw, y = (r + fy) * ph;
    holes += `<circle cx="${x + 1.5}" cy="${y + 1.5}" r="10" fill="#d6d1c9" opacity=".4"/><circle cx="${x}" cy="${y}" r="10" fill="#5d5a55"/>`;
  }
  return svg(defs, layer('mottle') + layer('grain', 0.18) + layer('stain', 0.22) + seams + holes);
}

function romanClay() {
  // Layered clouds at three scales read as troweled plaster; short sweeps add hand-applied movement.
  const defs = noise('base', {freq: 0.0019, octaves: 6, seed: 11, dark: '#b69d82', light: '#d8c7af', stretch: 2})
    + noise('mottle', {freq: 0.005, octaves: 5, seed: 23, dark: '#a88f74', light: '#e3d5c1', stretch: 1.8})
    + noise('sweep', {freq: '0.0035 0.011', octaves: 4, seed: 4, dark: '#a2896f', light: '#ebdfcd', stretch: 2.2})
    + noise('fine', {freq: 0.7, octaves: 2, seed: 9, dark: '#9a816b', light: '#efe5d6', stretch: 1.6});
  return svg(defs, layer('base') + layer('mottle', 0.22) + layer('sweep', 0.16) + layer('fine', 0.06));
}

function wallpaper() {
  // Art deco scallop repeat: rows of fans drawn top to bottom so each row overlaps the one above.
  const step = 120, radius = 84, bands = [8, 22, 36, 50, 64];
  let fans = '';
  for (let row = 0; row * step / 2 <= H + radius; row++) {
    const y = row * step / 2, offset = row % 2 ? step / 2 : 0;
    for (let x = -step + offset; x <= W + step; x += step) {
      fans += `<path d="M ${x - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z" fill="#1d3a36"/>`;
      fans += bands.map(inset => `<path d="M ${x - radius + inset} ${y} A ${radius - inset} ${radius - inset} 0 0 1 ${x + radius - inset} ${y}" fill="none" stroke="#c2a36b" stroke-width="${inset === 8 ? 3 : 2}" opacity="${inset === 8 ? 0.95 : 0.7}"/>`).join('');
      fans += `<circle cx="${x}" cy="${y - 6}" r="4" fill="#c2a36b"/>`;
    }
  }
  const defs = noise('paper', {freq: 0.9, octaves: 2, seed: 6, dark: '#0f201d', light: '#e9dcc2', stretch: 2});
  return svg(defs, `<rect width="${W}" height="${H}" fill="#1d3a36"/>${fans}${layer('paper', 0.06)}`);
}

function marble() {
  const defs = noise('cloud', {freq: 0.0012, octaves: 4, seed: 2, dark: '#d9d8d4', light: '#f8f7f3', stretch: 1.8})
    + veins('vein', {freq: '0.0009 0.0026', seed: 9, color: '#6f6b66', strength: 0.85, octaves: 5})
    + veins('fineVein', {freq: '0.0028 0.006', seed: 21, color: '#a39d95', strength: 0.35, octaves: 3});
  return svg(defs, layer('cloud') + layer('fineVein') + layer('vein'));
}

function cladding() {
  const pitch = 58, gap = 10, tones = ['#9a6a43', '#a8774d', '#8f613d', '#b07f55', '#96673f', '#a3724a'];
  let slats = '', edges = '';
  for (let x = 0, i = 0; x < W; x += pitch, i++) {
    const w = pitch - gap;
    slats += `<rect x="${x}" width="${w}" height="${H}" fill="${tones[(i * 7) % tones.length]}"/>`;
    edges += `<rect x="${x}" width="3" height="${H}" fill="#ffffff" opacity=".14"/><rect x="${x + w - 4}" width="4" height="${H}" fill="#000000" opacity=".22"/><rect x="${x + w}" width="${gap}" height="${H}" fill="#1c1510"/>`;
  }
  const defs = noise('grain', {freq: '0.22 0.0035', octaves: 3, seed: 8, dark: '#4a3120', light: '#e0b184', stretch: 2.2})
    + noise('figure', {freq: '0.02 0.004', octaves: 2, seed: 14, dark: '#5a3d27', light: '#caa078', stretch: 1.8})
    + '<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".08"/><stop offset="1" stop-color="#000000" stop-opacity=".25"/></linearGradient>';
  return svg(defs, slats + layer('grain', 0.38) + layer('figure', 0.15) + edges + `<rect width="${W}" height="${H}" fill="url(#shade)"/>`);
}

function graphic() {
  // LayeredFX mark from public/brand/layeredfx_app_icon.svg (viewBox 107.74), scaled up as a mural.
  const s = 8.6, size = 107.74 * s;
  const mark = `<g transform="translate(${W - size - 70} ${(H - size) / 2}) scale(${s})">
    <polygon fill="#ffffff" points="8.67 18.04 37.39 18.04 66.44 47.08 37.73 47.09 8.67 18.04"/>
    <polygon fill="#d6ff41" points="37.92 47.03 67 17.96 95.72 17.95 66.64 47.03 37.92 47.03"/>
    <polygon fill="#ffffff" points="66.59 60.71 37.52 89.78 8.8 89.79 37.87 60.71 66.59 60.71"/>
    <polygon fill="#d6ff41" points="99.07 57.07 70.02 86.11 63.55 86.11 52.43 74.99 66.75 60.68 70.37 57.07 99.07 57.07"/>
    <polygon fill="#e2e2e2" points="38.08 60.66 52.33 74.94 49.52 77.72 38.08 60.66"/>
    <polygon fill="#95aa1a" points="66.78 60.65 81.16 75.04 83.96 72.2 66.78 60.65"/>
    <polygon fill="#e2e2e2" points="37.93 47.07 52.17 32.79 49.37 30.01 37.93 47.07"/>
    <polygon fill="#d6ff41" points="95.85 89.7 67.13 89.7 63.51 86.09 38.08 60.66 66.79 60.66 81.11 74.97 95.85 89.7"/>
  </g>`;
  const defs = '<radialGradient id="glow" cx="0.72" cy="0.45" r="0.7"><stop offset="0" stop-color="#2a3346"/><stop offset="1" stop-color="#141925"/></radialGradient>'
    + '<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#ffffff" opacity=".1"/></pattern>';
  const body = `<rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#dots)"/>
    <polygon points="0,${H * 0.7} ${W * 0.4},0 ${W * 0.47},0 0,${H * 0.84}" fill="#aedb22"/>
    <polygon points="0,${H * 0.93} ${W * 0.5},0 ${W * 0.52},0 0,${H * 0.97}" fill="#d6ff41" opacity=".7"/>
    <circle cx="${W * 0.3}" cy="${H * 0.64}" r="330" fill="none" stroke="#d6ff41" stroke-width="3" opacity=".35"/>
    <circle cx="${W * 0.3}" cy="${H * 0.64}" r="250" fill="none" stroke="#ffffff" stroke-width="2" opacity=".18"/>${mark}`;
  return svg(defs, body);
}

mkdirSync(OUT, {recursive: true});
const textures = {concrete, 'roman-clay': romanClay, wallpaper, marble, cladding, graphic};
for (const [name, build] of Object.entries(textures)) {
  await sharp(Buffer.from(build())).webp({quality: 84}).toFile(`${OUT}/${name}.webp`);
  console.log(`wrote ${OUT}/${name}.webp`);
}
