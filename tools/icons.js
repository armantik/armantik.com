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
  lab: { seed: 61,
    acc: [['path', 'M14 31 L34 31 L39 39 C40 41 39 43 36 43 L12 43 C9 43 8 41 9 39 Z']],
    ink: [['path', 'M18 5 L30 5'], ['path', 'M21 5 L21 19 L9 39 C8 41 9 43 12 43 L36 43 C39 43 40 41 39 39 L27 19 L27 5'],
          ['circle', 21, 35, 4], ['circle', 28, 28, 3]] },
  system: { seed: 67,
    acc: [['rect', 17, 4, 14, 10]],
    ink: [['rect', 17, 4, 14, 10], ['rect', 4, 32, 14, 10], ['rect', 30, 32, 14, 10],
          ['path', 'M24 14 L24 22'], ['path', 'M11 32 L11 22 L37 22 L37 32']] },
  algorithms: { seed: 71,
    acc: [['circle', 12, 24, 10], ['circle', 18, 40, 9]],
    ink: [['circle', 24, 8, 9], ['circle', 12, 24, 9], ['circle', 36, 24, 9], ['circle', 6, 40, 8], ['circle', 18, 40, 8],
          ['path', 'M21 11 L15 20'], ['path', 'M27 11 L33 20'], ['path', 'M10 28 L8 36'], ['path', 'M14 28 L16 36']] },
  code: { seed: 73,
    acc: [['rect', 18, 14, 12, 20]],
    ink: [['path', 'M17 6 C12 6 12 9 12 14 L12 20 C12 23 10 24 7 24 C10 24 12 25 12 28 L12 34 C12 39 12 42 17 42'],
          ['path', 'M31 6 C36 6 36 9 36 14 L36 20 C36 23 38 24 41 24 C38 24 36 25 36 28 L36 34 C36 39 36 42 31 42'],
          ['path', 'M20 18 L28 18'], ['path', 'M20 24 L28 24'], ['path', 'M20 30 L25 30']] },
  person: { seed: 79,
    acc: [['circle', 24, 14, 20]],
    ink: [['circle', 24, 14, 18], ['path', 'M5 44 C6 28 42 28 43 44']] },
  briefcase: { seed: 83,
    acc: [['rect', 5, 26, 38, 15]],
    ink: [['rect', 5, 15, 38, 26], ['path', 'M17 15 L17 9 C17 8 18 7 19 7 L29 7 C30 7 31 8 31 9 L31 15'],
          ['path', 'M5 26 L43 26'], ['rect', 21, 23, 6, 6]] },
  rocket: { seed: 89,
    acc: [['path', 'M19 34 C19 40 22 43 24 46 C26 43 29 40 29 34 Z']],
    ink: [['path', 'M24 3 C32 10 34 20 32 32 L16 32 C14 20 16 10 24 3 Z'], ['circle', 24, 17, 7],
          ['path', 'M16 25 L9 32 L9 38 L16 33'], ['path', 'M32 25 L39 32 L39 38 L32 33'],
          ['path', 'M19 34 C19 40 22 43 24 46 C26 43 29 40 29 34']] },
  toolbox: { seed: 97,
    acc: [['rect', 4, 25, 40, 16]],
    ink: [['rect', 4, 17, 40, 24], ['path', 'M4 25 L44 25'], ['path', 'M17 17 L17 10 L31 10 L31 17'], ['rect', 21, 22, 6, 6]] },
  pencil: { seed: 101,
    acc: [['path', 'M30 10 L38 18 L17 39 L11 33 Z']],
    ink: [['path', 'M34 6 L42 14 L17 39 L8 42 L11 33 Z'], ['path', 'M30 10 L38 18'], ['path', 'M11 33 L17 39'],
          ['path', 'M6 46 C14 44 20 47 28 45']] },
  plane: { seed: 103,
    acc: [['path', 'M44 6 L24 30 L34 42 Z']],
    ink: [['path', 'M4 22 L44 6 L34 42 L24 30 Z'], ['path', 'M44 6 L24 30'], ['path', 'M24 30 L22 40 L28 35'],
          ['path', 'M4 34 L12 30'], ['path', 'M8 42 L16 37']] },
  article: { seed: 107,
    acc: [['rect', 15, 10, 13, 7]],
    ink: [['path', 'M10 4 L30 4 L40 14 L40 44 L10 44 Z'], ['path', 'M30 4 L30 14 L40 14'],
          ['path', 'M16 24 L34 24'], ['path', 'M16 31 L34 31'], ['path', 'M16 38 L28 38']] },
  help: { seed: 109,
    acc: [['path', 'M24 7 A17 17 0 0 1 41 24 L31 24 A7 7 0 0 0 24 17 Z'], ['path', 'M24 41 A17 17 0 0 1 7 24 L17 24 A7 7 0 0 0 24 31 Z']],
    ink: [['circle', 24, 24, 34], ['circle', 24, 24, 14],
          ['path', 'M12 12 L19 19'], ['path', 'M36 12 L29 19'], ['path', 'M12 36 L19 29'], ['path', 'M36 36 L29 29']] },
  route: { seed: 113,
    acc: [['path', 'M40 2 C44 2 46 5 46 8 C46 12 40 18 40 18 C40 18 34 12 34 8 C34 5 36 2 40 2 Z']],
    ink: [['circle', 8, 40, 7], ['path', 'M12 38 C22 34 14 24 24 22 C32 20 34 20 37 15'],
          ['path', 'M40 2 C44 2 46 5 46 8 C46 12 40 18 40 18 C40 18 34 12 34 8 C34 5 36 2 40 2 Z'], ['circle', 40, 8, 3]] },
  stairs: { seed: 127,
    acc: [['path', 'M34 15 L44 15 L44 42 L34 42 Z']],
    ink: [['path', 'M4 42 L4 33 L14 33 L14 24 L24 24 L24 15 L34 15 L34 6 L44 6 L44 42 Z'], ['path', 'M34 15 L44 15']] },
  flag: { seed: 131,
    acc: [['path', 'M10 6 C17 2 23 10 30 6 C33 5 36 5 39 6 L39 22 C36 21 33 21 30 22 C23 26 17 18 10 22 Z']],
    ink: [['path', 'M10 44 L10 4'], ['path', 'M10 6 C17 2 23 10 30 6 C33 5 36 5 39 6 L39 22 C36 21 33 21 30 22 C23 26 17 18 10 22'],
          ['path', 'M3 44 L17 44']] },
  palette: { seed: 137,
    acc: [['circle', 22, 12, 7], ['circle', 13, 31, 7]],
    ink: [['path', 'M24 4 C36 4 44 12 44 22 C44 30 38 32 33 31 C29 30 27 33 29 37 C31 41 28 44 24 44 C12 44 4 35 4 24 C4 13 12 4 24 4 Z'],
          ['circle', 14, 20, 6], ['circle', 22, 12, 6], ['circle', 33, 14, 6], ['circle', 13, 31, 6]] },
  type: { seed: 139,
    acc: [['circle', 35, 34, 17]],
    ink: [['path', 'M3 43 L15 6 L27 43'], ['path', 'M8 30 L22 30'], ['circle', 35, 34, 15], ['path', 'M42.5 26 L42.5 43']] },
  signpost: { seed: 149,
    acc: [['path', 'M24 9 L38 9 L43 14 L38 19 L24 19 Z']],
    ink: [['path', 'M24 4 L24 44'], ['path', 'M15 44 L33 44'], ['path', 'M24 9 L38 9 L43 14 L38 19 L24 19 Z'],
          ['path', 'M24 24 L10 24 L5 29 L10 34 L24 34 Z']] },
  copy: { seed: 151,
    acc: [['rect', 15, 5, 26, 30]],
    ink: [['rect', 15, 5, 26, 30], ['path', 'M15 13 L9 13 C8 13 7 14 7 15 L7 41 C7 42 8 43 9 43 L31 43 C32 43 33 42 33 41 L33 35']] },
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
figure .ico{width:56px;height:56px;color:var(--ink)} figure{width:84px} .btns{display:grid;gap:10px;max-width:420px;margin-top:20px}
.btn{width:100%;justify-content:space-between;min-height:54px} .lbl{display:inline-flex;align-items:center;gap:12px} .btn .ico{width:24px;height:24px}
</style></head><body>${sheet('light')}</body></html>`);
console.log(Object.keys(out).length, 'icons,', JSON.stringify(out).length, 'bytes');
