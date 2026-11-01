#!/usr/bin/env node
/* Writes what content.js describes into the HTML files, so the pages read the same without JavaScript.

   Search engines that run JavaScript (Google, Bing) and AI crawlers that don't (GPTBot, ClaudeBot,
   PerplexityBot) then see the same Lab list, home page Lab cards and Writing list. assets/site.js
   still redraws all of it in the browser with the same render(), so content.js stays the one file
   you edit. Run it after every change to content.js:

     node tools/prerender.js           write the files
     node tools/prerender.js --check   only report; exits with 1 when a page is out of date

   In every page that loads assets/site.js it fills
     data-lab="categories" | "all"         the home page Lab cards, the Lab page
     data-lab-count                        the number of guides
     data-writing, data-talks              the Writing and Talks rows (data-writing="5": the five newest),
                                           only while show.writing or show.talks is on, empty otherwise
     data-services, data-service-topics    only while show.services is on, empty otherwise
   A list whose switch is off stays empty, so a section you parked (a talk not yet announced, say)
   is not in the page source for crawlers to read.
   and it sets the hidden attribute on data-show and data-show-off by the switches in content.js,
   and the href (or hidden) on data-link. Items with hidden: true stay out.
   Plain Node, no packages to install. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

/* content.js sets window.SITE */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8'), sandbox, { filename: 'content.js' });
const SITE = sandbox.window.SITE;
if (!SITE) { console.error('content.js did not set window.SITE'); process.exit(2); }
const { render } = require(path.join(ROOT, 'assets', 'site.js'));

/* every .html file, skipping templates (_name.html), dot folders and tools/ */
function htmlFiles(dir, out) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.') || name === 'node_modules' || name === 'tools') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) htmlFiles(p, out);
    else if (name.endsWith('.html') && !name.startsWith('_')) out.push(p);
  }
  return out;
}

/* the file with <script>, <style>, <template> and comments blanked out (same length, so offsets match) */
function mask(html) {
  return html.replace(/<(script|style|template)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi, (m) => m.replace(/[^\n]/g, ' '));
}

/* every element whose opening tag carries attr: its value, the opening tag, and where its content ends */
function elements(html, masked, attr) {
  const has = new RegExp('\\s' + attr + '(?:="([^"]*)")?(?=[\\s/>]|$)');
  const out = [];
  const open = /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g;
  let m;
  while ((m = open.exec(masked))) {
    const a = m[2] && has.exec(m[2]);
    if (!a) continue;
    const tag = m[1].toLowerCase();
    const innerStart = m.index + m[0].length;
    /* the matching close tag, counting nested tags with the same name */
    const scan = new RegExp('<(/?)' + tag + '(?=[\\s/>])[^>]*>', 'gi');
    scan.lastIndex = innerStart;
    let depth = 1, s, innerEnd = -1;
    while ((s = scan.exec(masked))) {
      if (s[1]) { if (--depth === 0) { innerEnd = s.index; break; } } else if (!s[0].endsWith('/>')) depth++;
    }
    out.push({ value: a[1] || '', start: m.index, open: html.slice(m.index, innerStart), innerStart, innerEnd });
  }
  return out;
}

function setHidden(tag, hide) {
  let t = tag.replace(/\shidden(?:="[^"]*")?(?=[\s/>])/, '');
  return hide ? t.replace(/\s*(\/?)>$/, ' hidden$1>') : t;
}
function setHref(tag, href) {
  const v = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return /\shref="[^"]*"/.test(tag) ? tag.replace(/(\shref=")[^"]*"/, '$1' + v + '"') : tag.replace(/(\/?)>$/, ' href="' + v + '"$1>');
}
function attr(tag, name) {
  const m = new RegExp('\\s' + name + '="([^"]*)"').exec(tag);
  return m ? m[1] : '';
}

const changed = [];
for (const file of htmlFiles(ROOT, [])) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<script[^>]+assets\/site\.js/.test(html)) continue;
  const masked = mask(html);
  const body = /<body\b[^>]*\sdata-root="([^"]*)"/.exec(html);
  const icons = {};
  html.replace(/<template id="ico-([\w-]+)">([\s\S]*?)<\/template>/g, (_, id, svg) => { icons[id] = svg; });
  const R = render(SITE, { root: body ? body[1] : '', preview: false, icon: (id) => icons[id] || '' });
  const where = path.relative(ROOT, file);

  /* 1. contents of the lists */
  const edits = [];
  const fill = (name, fn) => {
    for (const el of elements(html, masked, name)) {
      if (el.innerEnd < 0) throw new Error(where + ': no closing tag for ' + el.open);
      edits.push({ from: el.innerStart, to: el.innerEnd, text: fn(el.value) });
    }
  };
  fill('data-lab', (v) => (v === 'categories' ? R.labCategories() : R.labAll()));
  fill('data-lab-count', () => R.labCount());
  fill('data-writing', (v) => (R.on('writing') ? R.writing(parseInt(v, 10) || 0) : ''));
  fill('data-talks', (v) => (R.on('talks') ? R.talks(parseInt(v, 10) || 0) : ''));
  fill('data-services', () => (R.on('services') ? R.services() : ''));
  fill('data-service-topics', () => (R.on('services') ? R.serviceTopics() : ''));

  /* 2. opening tags: switches and links (one tag can carry several of these) */
  const tags = new Map();
  for (const name of ['data-show', 'data-show-off', 'data-link']) {
    for (const el of elements(html, masked, name)) tags.set(el.start, el.open);
  }
  for (const [start, open] of tags) {
    let t = open;
    if (/\sdata-show="/.test(t)) t = setHidden(t, !R.on(attr(t, 'data-show')));
    if (/\sdata-show-off="/.test(t)) t = setHidden(t, R.on(attr(t, 'data-show-off')));
    if (/\sdata-link="/.test(t)) {
      let href = R.link(attr(t, 'data-link'));
      /* an Ask me button can open the form with its topic ticked, the same way assets/site.js does */
      const topic = /\sdata-ask-topic="/.test(t) ? attr(t, 'data-ask-topic') : '';
      const field = R.link('askTopicField');
      if (href && topic && field) href += (href.indexOf('?') < 0 ? '?' : '&') + 'usp=pp_url&' + field + '=' + encodeURIComponent(topic);
      t = href ? setHref(setHidden(t, false), href) : setHidden(t, true);
    }
    edits.push({ from: start, to: start + open.length, text: t });
  }

  /* apply from the end of the file backwards so earlier offsets stay valid */
  edits.sort((a, b) => b.from - a.from);
  let out = html;
  for (const e of edits) out = out.slice(0, e.from) + e.text + out.slice(e.to);
  if (out !== html) {
    changed.push(where);
    if (!CHECK) fs.writeFileSync(file, out);
  }
}

if (CHECK) {
  if (changed.length) { console.log('Out of date, run node tools/prerender.js:\n  ' + changed.join('\n  ')); process.exit(1); }
  console.log('All pages match content.js.');
} else {
  console.log(changed.length ? 'Updated from content.js:\n  ' + changed.join('\n  ') : 'All pages already match content.js.');
}
