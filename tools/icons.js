// Hand-drawn marker icons for armantik.com, made with rough.js.
// Each icon: "ink" strokes (currentColor) and one "accent" scribble fill (site petrol).
// Output: icons.json { name: "<svg ...>...</svg>" } and preview.html.
const rough = require('roughjs');
const fs = require('fs');
const gen = rough.generator();

const INK = { roughness: 1.25, bowing: 1.3, strokeWidth: 2.9, stroke: 'INK' };
const ACC = { roughness: 1.5, fill: 'ACC', fillStyle: 'hachure', hachureGap: 3.4, hachureAngle: -41, fillWeight: 1.7, stroke: 'none' };

// a pill (stadium) shape between two centres, as an SVG path
function pill(cx, cy, len, r, deg) {
  const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const c1 = [cx - (ux * len) / 2, cy - (uy * len) / 2], c2 = [cx + (ux * len) / 2, cy + (uy * len) / 2];
  const p = (c, s) => `${(c[0] + nx * r * s).toFixed(2)} ${(c[1] + ny * r * s).toFixed(2)}`;
  return `M${p(c1, 1)} L${p(c2, 1)} A${r} ${r} 0 0 0 ${p(c2, -1)} L${p(c1, -1)} A${r} ${r} 0 0 0 ${p(c1, 1)} Z`;
}

const ICONS = {
  connect: { seed: 13,
    acc: [['circle', 38, 21, 17]],
    ink: [['circle', 19, 15, 15], ['path', 'M4 42 C5 30 33 30 34 42'], ['path', 'M38 14 L38 28'], ['path', 'M31 21 L45 21']] },
  phone: { seed: 7,
    acc: [['path', 'M13 7 C10 7 7 10 7 13 C7 29 19 41 35 41 C38 41 41 38 41 35 L41 30 C41 29 40 28 39 28 L32 26 C31 26 30 26 29 27 L26 30 C21 28 20 27 18 22 L21 19 C22 18 22 17 22 16 L20 9 C20 8 19 7 18 7 Z']],
    ink: [['path', 'M13 7 C10 7 7 10 7 13 C7 29 19 41 35 41 C38 41 41 38 41 35 L41 30 C41 29 40 28 39 28 L32 26 C31 26 30 26 29 27 L26 30 C21 28 20 27 18 22 L21 19 C22 18 22 17 22 16 L20 9 C20 8 19 7 18 7 Z'],
          ['path', 'M29 6 C35 7 40 12 41 18'], ['path', 'M28 12 C31 13 34 15 35 19']] },
  email: { seed: 5,
    acc: [['path', 'M7 13 L24 26 L41 13 Z']],
    ink: [['rect', 6, 11, 36, 26], ['path', 'M7 13 L24 26 L41 13'], ['path', 'M7 36 L19 23'], ['path', 'M41 36 L29 23']] },
  save: { seed: 19,
    acc: [['circle', 39, 36, 15]],
    ink: [['rect', 4, 9, 32, 25], ['circle', 14.5, 18.5, 7], ['path', 'M8.5 30 C9.5 25 19.5 25 20.5 30'],
          ['path', 'M24 17 L31 17'], ['path', 'M24 23 L30 23'], ['path', 'M39 30 L39 42'], ['path', 'M33 36 L45 36']] },
  interview: { seed: 29,
    acc: [['path', 'M29 20 h10 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-2 v5 l-6 -5 h-8 a3 3 0 0 1 -3 -3 v-4 h6 a3 3 0 0 0 3 -3 Z']],
    ink: [['path', 'M8 7 h19 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-11 l-6 5 v-5 h-2 a3 3 0 0 1 -3 -3 v-12 a3 3 0 0 1 3 -3 z'],
          ['path', 'M31 20 h8 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-2 v5 l-6 -5 h-8 a3 3 0 0 1 -3 -3 v-4'],
          ['path', 'M12 13 L25 13'], ['path', 'M12 19 L21 19']] },
  mentoring: { seed: 31,
    acc: [['path', 'M24 24 C25 15 31 10 40 9 C40 18 33 23 24 24 Z']],
    ink: [['path', 'M24 42 C24 35 24 29 24 21'], ['path', 'M24 31 C16 31 10 26 9 18 C17 18 23 23 24 31 Z'],
          ['path', 'M24 24 C25 15 31 10 40 9 C40 18 33 23 24 24 Z'], ['path', 'M12 42 L36 42']] },
  hiring: { seed: 37,
    acc: [['circle', 18, 20, 12]],
    ink: [['rect', 9, 8, 30, 35], ['rect', 18, 5, 12, 6], ['path', 'M14 20 L17.5 23.5 L23 16.5'],
          ['path', 'M14 32 L17.5 35.5 L23 28.5'], ['path', 'M27 21 L34 21'], ['path', 'M27 33 L34 33']] },
  workshops: { seed: 43,
    acc: [['path', 'M11 26 L18 19 L24 23 L33 13 L33 27 L11 27 Z']],
    ink: [['rect', 6, 7, 36, 24], ['path', 'M14 31 L10 43'], ['path', 'M34 31 L38 43'], ['path', 'M24 31 L24 40'],
          ['path', 'M11 26 L18 19 L24 23 L33 13'], ['path', 'M28 13 L33 13 L33 18']] },
  ai: { seed: 53,
    acc: [['path', 'M38 3 C39 9 41 11 47 12 C41 13 39 15 38 21 C37 15 35 13 29 12 C35 11 37 9 38 3 Z']],
    ink: [['rect', 4, 14, 30, 26], ['path', 'M4 20 L34 20'], ['path', 'M10 26 L14 29.5 L10 33'], ['path', 'M17 34 L25 34'],
          ['path', 'M38 3 C39 9 41 11 47 12 C41 13 39 15 38 21 C37 15 35 13 29 12 C35 11 37 9 38 3 Z']] },
};

const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));
function draw(shape, opts) {
  const [t, ...a] = shape;
  if (t === 'path') return gen.path(a[0], opts);
  if (t === 'rect') return gen.rectangle(a[0], a[1], a[2], a[3], opts);
  if (t === 'circle') return gen.circle(a[0], a[1], a[2], opts);
  throw new Error(t);
}
const out = {};
for (const [name, ic] of Object.entries(ICONS)) {
  let parts = '';
  ic.acc.forEach((s, i) => {
    for (const p of gen.toPaths(draw(s, { ...ACC, seed: ic.seed + i }))) {
      if (p.stroke === 'none' || !p.d) continue;
      parts += `<path class="a" d="${round(p.d)}" stroke-width="${p.strokeWidth}"/>`;
    }
  });
  ic.ink.forEach((s, i) => {
    for (const p of gen.toPaths(draw(s, { ...INK, seed: ic.seed + 100 + i }))) {
      if (p.stroke === 'none' || !p.d) continue;
      parts += `<path d="${round(p.d)}" stroke-width="${p.strokeWidth}"/>`;
    }
  });
  out[name] = `<svg class="ico" viewBox="-4 -4 56 56" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">${parts}</svg>`;
}
fs.writeFileSync('icons.json', JSON.stringify(out, null, 1));

const css = fs.readFileSync(process.argv[2], 'utf8');
const cell = (n) => `<figure>${out[n]}<figcaption>${n}</figcaption></figure>`;
const sheet = (theme) => `<section data-t="${theme}"><div class="row">${Object.keys(out).map(cell).join('')}</div>
<div class="btns"><a class="btn primary"><span class="lbl">${out.connect}Connect on LinkedIn</span><span class="arrow">↗</span></a>
<a class="btn"><span class="lbl">${out.phone}Call or text</span><span class="num">Show number</span></a></div></section>`;
fs.writeFileSync('preview.html', `<!doctype html><html data-theme="light"><head><meta charset="utf-8"><style>${css}
body{padding:24px} .row{display:flex;flex-wrap:wrap;gap:18px} figure{margin:0;display:grid;justify-items:center;gap:6px;font:12px var(--mono);color:var(--slate)}
figure .ico{width:64px;height:64px;color:var(--ink)} .btns{display:grid;gap:10px;max-width:420px;margin-top:20px}
.btn{width:100%;justify-content:space-between;min-height:54px} .lbl{display:inline-flex;align-items:center;gap:12px} .btn .ico{width:24px;height:24px}
</style></head><body>${sheet('light')}</body></html>`);
console.log(Object.keys(out).length, 'icons,', JSON.stringify(out).length, 'bytes');
