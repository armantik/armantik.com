/* Static checks over every page and script of the site.
   1. Links and assets: every local href/src points to a file that exists.
   2. Scripts: every .js file and inline <script> parses; every JSON-LD block is valid JSON.
   3. Search: indexable pages have a title, a description, a canonical link to their own address and
      structured data (see "Search engines" in README.md); sitemap.xml lists exactly the indexable pages.
   4. Writing style: no em dashes, en dashes or spaced hyphens used as punctuation in visible text.
   5. Contact details: the email address and phone number never appear as plain text anywhere, and the
      phone number's scrambled bytes live only on the card page. */
import path from "node:path";
import vm from "node:vm";
import { load } from "cheerio";
import { ROOT, SITE_URL, Report, listFiles, read, exists, loadSite, contactDetails, phonePattern, dashInProse } from "./lib.mjs";

const r = new Report("Site checks");
const allFiles = listFiles();
const pages = listFiles([".html"]);

/* robots.txt: pages under a Disallow rule are not meant for search engines */
const robotsTxt = exists("robots.txt") ? read("robots.txt") : "";
const disallowed = [...robotsTxt.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1].replace(/^\//, ""));
if (!/^Sitemap:\s*https:\/\/armantik\.com\/sitemap\.xml\s*$/im.test(robotsTxt)) r.error("robots.txt", "should point to https://armantik.com/sitemap.xml");

/* resolves a link found in `from` to a repo path, or null when it is external or page-local */
function localTarget(from, url) {
  if (!url) return null;
  url = url.trim();
  if (/^(https?:)?\/\//i.test(url)) {
    if (!url.startsWith(SITE_URL + "/") && url !== SITE_URL) return null;
    url = "/" + url.slice(SITE_URL.length).replace(/^\//, "");
  }
  if (/^(#|mailto:|tel:|sms:|data:|javascript:|blob:)/i.test(url)) return null;
  let p = url.split("#")[0].split("?")[0];
  if (!p) return null;
  try { p = decodeURI(p); } catch { /* keep as is */ }
  p = p.startsWith("/") ? p.slice(1) : path.posix.join(path.posix.dirname(from), p);
  p = path.posix.normalize(p);
  if (p === "." || p === "") p = "index.html";
  if (p.endsWith("/")) p += "index.html";
  else if (!path.posix.extname(p) && exists(p + "/index.html")) p += "/index.html";
  return p;
}
const pageUrl = (rel) => SITE_URL + "/" + rel.replace(/(^|\/)index\.html$/, "$1");

let linkCount = 0, scriptCount = 0;
const indexable = [];
const seenTitles = new Map(), seenDescriptions = new Map();

for (const page of pages) {
  const html = read(page);
  const $ = load(html);

  /* 1. links and assets */
  const refs = [];
  $("a[href], link[href], area[href]").each((_, el) => refs.push($(el).attr("href")));
  $("script[src], img[src], source[src], video[src], audio[src], iframe[src], track[src], embed[src]").each((_, el) => refs.push($(el).attr("src")));
  $("img[srcset], source[srcset]").each((_, el) => $(el).attr("srcset").split(",").forEach((s) => refs.push(s.trim().split(/\s+/)[0])));
  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => refs.push($(el).attr("content")));
  const isTemplate = disallowed.some((d) => d && page.startsWith(d));
  for (const ref of refs) {
    if (isTemplate && /\[[^\]]+\]/.test(ref || "")) continue; /* "[LIKE THIS]" placeholders in templates */
    const target = localTarget(page, ref);
    if (!target) continue;
    linkCount++;
    if (!exists(target)) r.error(page, `links to "${ref}", but ${target} does not exist`);
  }

  /* 2. inline scripts and structured data */
  $("script:not([src])").each((i, el) => {
    const type = ($(el).attr("type") || "").toLowerCase();
    const code = $(el).html() || "";
    if (type === "application/ld+json") {
      try { JSON.parse(code); } catch (e) { r.error(page, `structured data (JSON-LD) is not valid JSON: ${e.message}`); }
    } else if (!type || type === "text/javascript" || type === "application/javascript") {
      scriptCount++;
      try { new vm.Script(code, { filename: `${page} (inline script ${i + 1})` }); }
      catch (e) { r.error(page, `inline script ${i + 1} does not parse: ${e.message}`); }
    }
  });

  /* 3. search tags */
  const robots = $('meta[name="robots"]').attr("content") || "";
  const isIndexable = !/noindex/i.test(robots) && !disallowed.some((d) => d && page.startsWith(d));
  if (isIndexable) {
    indexable.push(page);
    const title = $("title").first().text().trim();
    const desc = ($('meta[name="description"]').attr("content") || "").trim();
    const canonical = ($('link[rel="canonical"]').attr("href") || "").trim();
    if (!title) r.error(page, "has no <title>");
    if (!desc) r.error(page, "has no meta description");
    else if (desc.length < 50 || desc.length > 180) r.warn(page, `meta description is ${desc.length} characters; search results show about 50 to 160`);
    if (!canonical) r.error(page, "has no canonical link");
    else if (canonical !== pageUrl(page)) r.error(page, `canonical link is ${canonical}, expected ${pageUrl(page)}`);
    if (!$('script[type="application/ld+json"]').length) r.error(page, "has no structured data (JSON-LD)");
    for (const p of ["og:title", "og:description", "og:url"]) if (!$(`meta[property="${p}"]`).attr("content")) r.warn(page, `has no ${p} tag`);
    const ogUrl = $('meta[property="og:url"]').attr("content");
    if (ogUrl && canonical && ogUrl !== canonical) r.error(page, `og:url (${ogUrl}) differs from the canonical link (${canonical})`);
    if (title) { if (seenTitles.has(title)) r.warn(page, `has the same <title> as ${seenTitles.get(title)}`); else seenTitles.set(title, page); }
    if (desc) { if (seenDescriptions.has(desc)) r.warn(page, `has the same description as ${seenDescriptions.get(desc)}`); else seenDescriptions.set(desc, page); }
  }

  /* 4. dashes in visible text, the title and the descriptions people see in search results */
  const metaText = [$("title").first().text()];
  $('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').each((_, el) => metaText.push($(el).attr("content")));
  for (const t of metaText) { const hit = dashInProse(t); if (hit) r.error(page, `dash used as punctuation in the page title or description: "${hit}"`); }
  const $text = load(html);
  $text("script, style, pre, code, kbd, samp, svg, textarea, template, noscript").remove();
  let dashHits = 0;
  (function walk(node) {
    for (const child of node.children || []) {
      if (child.type === "text") {
        const hit = dashInProse(child.data);
        if (hit && dashHits++ < 5) r.error(page, `dash used as punctuation in visible text: "${hit}"`);
      } else walk(child);
    }
  })($text.root()[0]);
  $text("[alt], [title], [aria-label]").each((_, el) => {
    for (const a of ["alt", "title", "aria-label"]) { const hit = dashInProse($text(el).attr(a)); if (hit) r.error(page, `dash used as punctuation in the ${a} text: "${hit}"`); }
  });
}

/* sitemap.xml lists exactly the indexable pages, each one existing */
if (!exists("sitemap.xml")) r.error("sitemap.xml", "is missing");
else {
  const xml = read("sitemap.xml");
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    loc: (m[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/) || [])[1],
    lastmod: (m[1].match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1],
  }));
  const listed = new Set();
  const tomorrow = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);
  for (const u of urls) {
    if (!u.loc || !u.loc.startsWith(SITE_URL + "/")) { r.error("sitemap.xml", `has an entry outside ${SITE_URL}: ${u.loc}`); continue; }
    const target = localTarget("index.html", u.loc);
    if (listed.has(target)) r.error("sitemap.xml", `lists ${u.loc} twice`);
    listed.add(target);
    if (!exists(target)) r.error("sitemap.xml", `lists ${u.loc}, but ${target} does not exist`);
    else if (!indexable.includes(target)) r.error("sitemap.xml", `lists ${u.loc}, which is marked noindex or blocked in robots.txt`);
    if (u.lastmod && (!/^\d{4}-\d{2}-\d{2}$/.test(u.lastmod) || u.lastmod > tomorrow)) r.error("sitemap.xml", `has an invalid or future lastmod ${u.lastmod} for ${u.loc}`);
  }
  for (const p of indexable) if (!listed.has(p)) r.error("sitemap.xml", `does not list ${pageUrl(p)} (add it, or mark the page noindex)`);
  r.note(`Sitemap: ${urls.length} addresses, ${indexable.length} indexable pages.`);
}

/* every JavaScript file parses */
for (const f of listFiles([".js", ".mjs"])) {
  scriptCount++;
  try { new vm.Script(read(f).replace(/^#!.*/, ""), { filename: f }); }
  catch (e) {
    if (f.endsWith(".mjs") || /^\s*(import|export)\s/m.test(read(f))) continue; /* ES modules are parsed by Node's own loader when they run */
    r.error(f, `does not parse: ${e.message}`);
  }
}

/* content.js: what site.js renders on the home page, Lab and Writing */
try {
  const site = loadSite();
  (function walk(v, where) {
    if (typeof v === "string") {
      if (/(^|\.)(href|url|src|image)$/i.test(where)) {
        const target = localTarget("index.html", v);
        if (target && !exists(target)) r.error("content.js", `${where} points to "${v}", but ${target} does not exist`);
      } else {
        const hit = dashInProse(v);
        if (hit) r.error("content.js", `dash used as punctuation in ${where}: "${hit}"`);
      }
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (v && typeof v === "object") for (const k of Object.keys(v)) walk(v[k], where ? `${where}.${k}` : k);
  })(site, "");
} catch (e) { r.error("content.js", `could not be loaded: ${e.message}`); }

/* contact details never appear as plain text */
const { email, phone, phoneBytes } = contactDetails();
const phoneRe = phone ? phonePattern(phone) : null;
const textFiles = allFiles.filter((f) => /\.(html?|js|mjs|css|md|xml|txt|json|svg|webmanifest|vcf)$/i.test(f));
for (const f of textFiles) {
  const s = read(f);
  if (email && s.toLowerCase().includes(email.toLowerCase())) r.error(f, "contains the email address as plain text (keep it scrambled in content.js)");
  if (phoneRe && phoneRe.test(s)) r.error(f, "contains the phone number as plain text (keep it scrambled on the card page)");
  if (phoneBytes && f !== "card/index.html" && s.replace(/\s/g, "").includes(phoneBytes.replace(/\s/g, ""))) r.error(f, "contains the phone number's scrambled bytes; they belong only on the card page");
  if (f !== "card/index.html" && /href\s*=\s*["']tel:/i.test(s)) r.error(f, "has a tel: link; the phone number belongs only on the card page");
}
if (!email) r.warn("content.js", "no email found in links.emailBytes, so the email privacy check did not run");
if (!phone) r.warn("card/index.html", "no phone number found, so the phone privacy check did not run");

r.note(`Checked ${pages.length} pages, ${linkCount} local links and assets, ${scriptCount} scripts, ${textFiles.length} files for contact details.`);
r.finish();
