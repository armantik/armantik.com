"""Draws the Arman✓ logo and the A✓ mark from JetBrains Mono Bold, and writes every copy.

The tick is drawn, not typed: its short arm runs parallel to the A's right leg, its long
arm parallel to the A's left leg, with the font's own stroke weight and flat cuts like the
font's V. In the logo the tick follows the n; in the mark it follows the A.

Writes:
  assets/logo.svg, assets/logo-dark.svg   the logo with fixed colors (print, slides, posts)
  assets/favicon.svg                       the mark, used as the browser icon
  favicon.ico, apple-touch-icon.png        the mark for old browsers and the iPhone home screen
  every <svg data-logo="logo">, "mark" and "tick" in the HTML pages (paths only;
  the opening tag keeps its class, size and label)

Run from the repo root:
  pip install fonttools brotli shapely pillow
  npm pack @fontsource/jetbrains-mono && tar -xzf fontsource-jetbrains-mono-*.tgz
  python3 tools/logo.py package/files/jetbrains-mono-latin-700-normal.woff2
"""
import math
import pathlib
import re
import sys

from fontTools.pens.basePen import BasePen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw
from shapely import affinity
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

ROOT = pathlib.Path(__file__).resolve().parent.parent
PETROL, SEA, PAPER, INK, NIGHT_INK = "#0F5C55", "#5BB8AA", "#FAFBF9", "#16211F", "#E3EAE7"
TICK_GAP = 1.0  # space between the A and the tick, in stroke widths


class PolyPen(BasePen):
    """Flattens glyph outlines into point rings (curves sampled)."""

    def __init__(self, glyphset):
        super().__init__(glyphset)
        self.rings, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, 13):
            t = i / 12
            self.cur.append(tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d
                                  for a, b, c, d in zip(p0, p1, p2, p3)))

    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, 9):
            t = i / 8
            self.cur.append(tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c for a, b, c in zip(p0, p1, p2)))

    def _closePath(self):
        if len(self.cur) > 2:
            self.rings.append(self.cur)
        self.cur = []

    _endPath = _closePath


def ring_area(r):
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1])) / 2


class Font:
    def __init__(self, path):
        f = TTFont(path)
        self.gs, self.cmap = f.getGlyphSet(), f.getBestCmap()
        self.a, _ = self.glyph("A")
        x0, _, x1, self.cap = self.a.bounds

        def edges(y):
            cut = self.a.intersection(LineString([(x0 - 10, y), (x1 + 10, y)]))
            return sorted(getattr(cut, "geoms", [cut]), key=lambda g: g.bounds[0])

        ya, yb = 0.12 * self.cap, 0.62 * self.cap
        pa, pb = edges(ya), edges(yb)
        self.kL = (pb[0].bounds[0] - pa[0].bounds[0]) / (yb - ya)  # left leg, x per unit of height
        self.kR = (pa[-1].bounds[2] - pb[-1].bounds[2]) / (yb - ya)  # right leg
        self.xr0 = pa[-1].bounds[2] + self.kR * ya  # right leg's outer edge at the baseline
        self.sw = (pa[0].bounds[2] - pa[0].bounds[0]) / math.sqrt(1 + self.kL ** 2)  # stroke width

    def glyph(self, ch, dx=0):
        pen = PolyPen(self.gs)
        self.gs[self.cmap[ord(ch)]].draw(pen)
        rings = [[(x + dx, y) for x, y in r] for r in pen.rings]
        sign = math.copysign(1, ring_area(max(rings, key=lambda r: abs(ring_area(r)))))
        ink = unary_union([Polygon(r).buffer(0) for r in rings if math.copysign(1, ring_area(r)) == sign])
        holes = [Polygon(r).buffer(0) for r in rings if math.copysign(1, ring_area(r)) != sign]
        return (ink.difference(unary_union(holes)) if holes else ink), self.gs[self.cmap[ord(ch)]].width

    def outline(self, text, scale, tx, ty):
        """SVG path of the letters, scaled and moved (y flipped), keeping the font's curves."""
        pen = SVGPathPen(self.gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
        x = 0
        for ch in text:
            g = self.gs[self.cmap[ord(ch)]]
            g.draw(TransformPen(pen, (scale, 0, 0, -scale, tx + scale * x, ty)))
            x += g.width
        return pen.getCommands()

    def tick(self, vx):
        """The tick, with the centre of its bottom point at x=vx."""
        sw, cap, vy = self.sw, self.cap, -1.5 * self.sw
        s = (vx - self.kR * (cap * 0.5 + sw - vy), cap * 0.5 + sw)
        e = (vx + self.kL * (cap + sw - vy), cap + sw)
        short = LineString([s, (vx, vy)]).buffer(sw / 2, cap_style=2).intersection(box(-1e5, 0, 1e5, cap * 0.5))
        long_ = LineString([(vx, vy), e]).buffer(sw / 2, cap_style=2).intersection(box(-1e5, 0, 1e5, cap))
        return unary_union([short, long_])

    def short_arm_vx(self, x_left_edge_at_mid):
        """vx so the short arm's left edge passes x_left_edge_at_mid at half the cap height."""
        hw = self.sw / 2 * math.sqrt(1 + self.kR ** 2)
        return x_left_edge_at_mid + hw + self.kR * (self.cap * 0.5 + 1.5 * self.sw)

    def mark(self):
        x_mid = self.xr0 - self.kR * self.cap * 0.5 + TICK_GAP * self.sw
        return self.a, self.tick(self.short_arm_vx(x_mid))

    def logo(self):
        parts, x = [], 0
        for ch in "Arman":
            g, adv = self.glyph(ch, x)
            parts.append(g)
            x += adv
        n = parts[-1]
        gap = (adv - (n.bounds[2] - n.bounds[0])) * 0.9  # the font's own space between letters
        return unary_union(parts), self.tick(self.short_arm_vx(n.bounds[2] + gap))


def d_of(geom, fx, fy):
    out = []
    for p in getattr(geom, "geoms", [geom]):
        for ring in [p.exterior, *p.interiors]:
            pts = [(fx(x), fy(y)) for x, y in list(ring.coords)[:-1]]
            out.append("M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z")
    return "".join(out)


def logo_paths(font):
    letters, tick = font.logo()
    x0, y0, x1, y1 = unary_union([letters, tick]).bounds
    s = 100 / (y1 - y0)  # the logo is 100 units tall: cap height to baseline
    fx, fy = (lambda x: (x - x0) * s), (lambda y: (y1 - y) * s)
    return round((x1 - x0) * s, 1), font.outline("Arman", s, -x0 * s, y1 * s), d_of(tick, fx, fy)


def tick_paths(font):
    """The tick on its own, 100 units tall, for lists that use it as a bullet."""
    _, tick = font.logo()
    x0, y0, x1, y1 = tick.bounds
    s = 100 / (y1 - y0)
    return round((x1 - x0) * s, 1), d_of(tick, lambda x: (x - x0) * s, lambda y: (y1 - y) * s)


def mark_paths(font):
    a, tick = font.mark()
    x0, y0, x1, y1 = unary_union([a, tick]).bounds
    s = min(46 / (x1 - x0), 34 / (y1 - y0))
    tx, ty = 32 - s * (x0 + x1) / 2, 32 + s * (y0 + y1) / 2
    fx, fy = (lambda x: tx + s * x), (lambda y: ty - s * y)
    return font.outline("A", s, tx, ty) + d_of(tick, fx, fy), unary_union([a, tick]), (s, tx, ty)


def raster_mark(geom, tf, size, rounded):
    """The mark as a PNG image: paper on petrol, drawn 8x larger and scaled down."""
    s, tx, ty = tf
    k = size * 8 / 64
    img = Image.new("RGBA", (size * 8, size * 8), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    if rounded:
        dr.rounded_rectangle([0, 0, size * 8 - 1, size * 8 - 1], radius=14 * k, fill=PETROL)
    else:
        dr.rectangle([0, 0, size * 8, size * 8], fill=PETROL)
    for p in getattr(geom, "geoms", [geom]):
        pt = lambda c: ((tx + s * c[0]) * k, (ty - s * c[1]) * k)
        dr.polygon([pt(c) for c in p.exterior.coords], fill=PAPER)
        for hole in p.interiors:
            dr.polygon([pt(c) for c in hole.coords], fill=PETROL)
    return img.resize((size, size), Image.LANCZOS)


def main(font_path):
    font = Font(font_path)
    w, d_letters, d_tick = logo_paths(font)
    tw, d_tick_only = tick_paths(font)
    d_mark, mark_geom, tf = mark_paths(font)

    # the inside of each inline copy; colors come from the page (see assets/style.css)
    logo_inner = (f'<path fill="currentColor" d="{d_letters}"/>'
                  f'<path style="fill:var(--logo-tick,{PETROL})" d="{d_tick}"/>')
    tick_inner = f'<path style="fill:var(--logo-tick,{PETROL})" d="{d_tick_only}"/>'
    mark_inner = (f'<rect width="64" height="64" rx="14" style="fill:var(--mark-bg,{PETROL})"/>'
                  f'<path style="fill:var(--mark-ink,{PAPER})" d="{d_mark}"/>')

    def svg_file(inner):
        return f'<svg xmlns="http://www.w3.org/2000/svg" {inner}</svg>\n'

    (ROOT / "assets/logo.svg").write_text(svg_file(
        f'viewBox="0 0 {w} 100" role="img" aria-label="Arman Ajabkhani"><path fill="{INK}" d="{d_letters}"/>'
        f'<path fill="{PETROL}" d="{d_tick}"/>'))
    (ROOT / "assets/logo-dark.svg").write_text(svg_file(
        f'viewBox="0 0 {w} 100" role="img" aria-label="Arman Ajabkhani"><path fill="{NIGHT_INK}" d="{d_letters}"/>'
        f'<path fill="{SEA}" d="{d_tick}"/>'))
    (ROOT / "assets/favicon.svg").write_text(svg_file(
        f'viewBox="0 0 64 64" role="img" aria-label="Arman Ajabkhani"><rect width="64" height="64" rx="14" fill="{PETROL}"/>'
        f'<path fill="{PAPER}" d="{d_mark}"/>'))
    sizes = [raster_mark(mark_geom, tf, n, True) for n in (48, 32, 16)]
    sizes[0].save(ROOT / "favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)], append_images=sizes[1:])
    raster_mark(mark_geom, tf, 180, False).convert("RGB").save(ROOT / "apple-touch-icon.png", optimize=True)

    # rewrite every inline copy in the pages
    pat = re.compile(r'(<svg\b[^>]*\bdata-logo="(logo|mark|tick)"[^>]*>)(.*?)(</svg>)', re.S)

    def fix(m):
        tag, kind = m.group(1), m.group(2)
        if kind in ("logo", "tick"):
            width, inner = (w, logo_inner) if kind == "logo" else (tw, tick_inner)
            tag = re.sub(r'viewBox="[^"]*"', f'viewBox="0 0 {width} 100"', tag)
            hm = re.search(r'\bheight="([\d.]+)"', tag)
            if hm:
                tag = re.sub(r'\bwidth="[\d.]+"', f'width="{round(float(hm.group(1)) * width / 100)}"', tag)
            return tag + inner + m.group(4)
        return re.sub(r'viewBox="[^"]*"', 'viewBox="0 0 64 64"', tag) + mark_inner + m.group(4)

    changed = 0
    for page in sorted(ROOT.rglob("*.html")):
        if any(part in ("node_modules", ".git") for part in page.parts):
            continue
        text = page.read_text()
        new = pat.sub(fix, text)
        if new != text:
            page.write_text(new)
            changed += 1
    print(f"logo {w} x 100, stroke {font.sw:.0f} units, legs {font.kL:.3f} and {font.kR:.3f}; {changed} pages updated")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
