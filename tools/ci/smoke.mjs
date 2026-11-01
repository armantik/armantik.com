/* Opens every page in headless Chromium, the way a visitor would, at desktop and phone width.
   Fails on: JavaScript errors, local files that fail to load, a page wider than a phone screen,
   dashes used as punctuation in text the scripts put on the page, contact details visible before anyone
   taps, links to #anchors that do not exist, and a Java guide that does not render all its questions.
   External requests (fonts) are blocked so the run is fast and does not depend on other sites. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ROOT, Report, listFiles, loadGuide, contactDetails, phonePattern, dashInProse, GUIDE_PAGE } from "./lib.mjs";

const r = new Report("Browser smoke test");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".pdf": "application/pdf", ".vcf": "text/vcard" };

/* a tiny static server, like GitHub Pages: folders serve index.html, missing files are 404 */
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "");
  if (!p || p.endsWith("/")) p += "index.html";
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const pages = listFiles([".html"]);
const { email, phone } = contactDetails();
const phoneRe = phone ? phonePattern(phone) : null;
const idsByPage = new Map();
const anchorLinks = [];

const browser = await chromium.launch();
try {
  for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.route((url) => !url.href.startsWith(BASE), (route) => route.abort());
    for (const page of pages) {
      const tab = await context.newPage();
      const problems = new Set();
      tab.on("pageerror", (e) => problems.add(`JavaScript error: ${e.message.split("\n")[0]}`));
      tab.on("console", (m) => { if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) problems.add(`console error: ${m.text().split("\n")[0]}`); });
      tab.on("requestfailed", (q) => { if (q.url().startsWith(BASE)) problems.add(`could not load ${q.url().slice(BASE.length)}`); });
      /* "[LIKE THIS]" placeholders in the article template are meant to be replaced, so their 404 is expected */
      tab.on("response", (s) => { if (s.url().startsWith(BASE) && s.status() >= 400 && s.request().resourceType() !== "document" && !/%5B|\[/i.test(s.url())) problems.add(`${s.status()} for ${s.url().slice(BASE.length)}`); });
      try {
        await tab.goto(BASE + page, { waitUntil: "load", timeout: 30000 });
        await tab.waitForTimeout(250);
      } catch (e) { problems.add(`page did not load: ${e.message.split("\n")[0]}`); }

      /* a forwarding page (meta refresh) ends up showing another page; that page's links are relative to
         its own folder, and it is checked on its own, so its ids and #anchor links are not filed under this one */
      let shown = page;
      try { shown = decodeURIComponent(new URL(tab.url()).pathname).replace(/^\/+/, ""); if (!shown || shown.endsWith("/")) shown += "index.html"; } catch { /* keep page */ }
      const forwarded = shown !== page;

      const info = await tab.evaluate(() => {
        const skip = "SCRIPT,STYLE,PRE,CODE,KBD,SAMP,SVG,TEXTAREA,TEMPLATE,NOSCRIPT";
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => (n.parentElement && n.parentElement.closest(skip.split(",").join(",").toLowerCase()) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        const texts = [];
        while (walker.nextNode()) { const t = walker.currentNode.data.replace(/\s+/g, " ").trim(); if (t) texts.push(t); }
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          texts,
          bodyText: document.body.innerText,
          ids: [...document.querySelectorAll("[id]")].map((e) => e.id),
          anchors: [...document.querySelectorAll("a[href*='#']")].map((a) => a.getAttribute("href")),
        };
      }).catch(() => null);

      if (info) {
        if (label === "phone" && info.overflow > 1) problems.add(`is ${info.overflow}px wider than a 390px phone screen (sideways scrolling)`);
        if (label === "desktop") {
          if (!forwarded) {
            idsByPage.set(page, new Set(info.ids));
            for (const href of info.anchors) anchorLinks.push({ page, href });
          }
          let dashes = 0;
          for (const t of info.texts) {
            const hit = dashInProse(t);
            if (hit && dashes++ < 3) problems.add(`dash used as punctuation in rendered text: "${hit}"`);
          }
          if (email && info.bodyText.toLowerCase().includes(email.toLowerCase())) problems.add("shows the email address as text before anyone taps");
          if (phoneRe && phoneRe.test(info.bodyText)) problems.add("shows the phone number as text before anyone taps");
        }
      }

      /* the theme switch works on the home page */
      if (page === "index.html" && label === "desktop") {
        const before = await tab.evaluate(() => document.documentElement.getAttribute("data-theme"));
        await tab.click("[data-theme-toggle]").catch(() => problems.add("has no working theme switch"));
        const after = await tab.evaluate(() => document.documentElement.getAttribute("data-theme"));
        if (before === after) problems.add("theme switch did not change the theme");
      }

      /* the Java guide renders every question, filters by level and opens every answer */
      if (page === GUIDE_PAGE && label === "desktop") {
        const data = loadGuide();
        const n = data.length, basic = data.filter((x) => x.level === "Basic").length;
        const count = await tab.textContent("#jg-count").catch(() => "");
        if (count !== `${n} of ${n}`) problems.add(`Java guide shows "${count}", expected "${n} of ${n}"`);
        await tab.click('#jg-level button[data-v="Basic"]').catch(() => {});
        const basicCount = await tab.textContent("#jg-count").catch(() => "");
        if (basicCount !== `${basic} of ${n}`) problems.add(`Java guide Basic filter shows "${basicCount}", expected "${basic} of ${n}"`);
        await tab.click('#jg-level button[data-v="All"]').catch(() => {});
        const bad = await tab.evaluate(() => new Promise((done) => {
          document.querySelectorAll(".q").forEach((d) => { d.open = true; });
          setTimeout(() => {
            const out = [];
            document.querySelectorAll(".q").forEach((d) => {
              const b = d.querySelector(".q-body");
              if (!b || !b.querySelector(".tldr") || !b.querySelector(".ex pre")) out.push(`${d.id} has no short answer or code`);
              const visible = [...b.querySelectorAll("p, li, summary, h4")].map((e) => { const c = e.cloneNode(true); c.querySelectorAll("code").forEach((x) => x.remove()); return c.textContent; }).join(" ");
              if (/`|\*\*/.test(visible)) out.push(`${d.id} shows raw \` or ** markup`);
            });
            done(out);
          }, 300);
        }));
        bad.slice(0, 10).forEach((b) => problems.add(`Java guide question ${b}`));
        if (bad.length > 10) problems.add(`Java guide: ${bad.length - 10} more questions with rendering problems`);
      }

      for (const p of problems) r.error(page, `${p} (${label})`);
      await tab.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

/* links to #anchors point at something that exists once the page has rendered */
for (const { page, href } of anchorLinks) {
  if (/^(https?:|mailto:|tel:)/i.test(href) || href === "#") continue;
  const [file, frag] = href.split("#");
  if (!frag) continue;
  let target = file ? path.posix.normalize(path.posix.join(path.posix.dirname(page), file.split("?")[0])) : page;
  if (target.endsWith("/") || target === ".") target = (target === "." ? "" : target) + "index.html";
  if (!idsByPage.has(target)) continue; /* not a page, or already reported as a broken link */
  if (!idsByPage.get(target).has(decodeURIComponent(frag))) r.error(page, `links to ${href}, but there is no id="${frag}" on ${target}`);
}

r.note(`Opened ${pages.length} pages at 1280px and 390px wide.`);
r.finish();
