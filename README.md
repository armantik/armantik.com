# armantik.com

Personal site of Arman Ajabkhani. Plain HTML, CSS and a little JavaScript. No build step, no framework: GitHub Pages serves the files exactly as they are.

## What's where

```
armantik.com/
├── index.html                 home page: hero, the three Lab tracks, about, experience, now, toolbox, writing, contact
├── content.js                 THE file you edit to add things (articles, talks, lab guides, links, switches)
├── lab/
│   ├── index.html             the Learning Lab (system design, algorithms, Java), built from content.js
│   ├── *.html                 one file per guide; each one works on its own
│   └── data/                  question bank for the Senior Java Backend Guide
├── writing/
│   ├── index.html             all articles, posts and talks, built from content.js
│   └── _template.html         copy this to write an article on your own site
├── help/
│   ├── index.html             How I help: the five ways, as tiles (switch: show.help)
│   └── */index.html           one short page each: interview prep, mentoring, technical hiring, workshops, AI-assisted development
├── mentoring/index.html       old address, forwards to help/
├── card/index.html            landing page for the NFC tag and the QR code on the business card (noindex; open armantik.com/card/)
├── brand/index.html           colors, type and the mark (not in the menu; open armantik.com/brand/)
├── assets/
│   ├── style.css              shared look; change a color once and every page follows
│   ├── site.js                builds the lists from content.js (no need to edit)
│   ├── theme.js               the light and dark switch (no need to edit)
│   ├── icons/                 hand-drawn icons as separate SVG files (for print, slides and posts)
│   ├── og-image.png           the 1200x630 image shown when a page is shared on LinkedIn, Slack and the like
│   └── favicon.svg            the mark
├── 404.html                   shown for missing pages
├── CNAME                      tells GitHub Pages to serve this repo at armantik.com
└── .nojekyll                  tells GitHub Pages to serve files as they are (keep it)
```

## Add things

### An article or post that lives elsewhere (Medium, LinkedIn)

Open `content.js`, find `writing: [`, and add a block:

```js
{
  title: "Benchmarking MCP servers in four languages",
  date: "2026-02-15",
  href: "https://medium.com/@you/your-article",
  source: "Medium",
  summary: "What I measured, and why Java and Go came out on top."
},
```

Save, commit, push. It appears on the home page (the five newest) and on `/writing/`, sorted newest first. The date only sets the order; it isn't shown.

### An article on your own site

1. Copy `writing/_template.html` to `writing/2026-11-short-title.html`.
2. Replace every `[LIKE THIS]` placeholder. The template shows each building block: heading, paragraph, list, code, quote, table, image, note.
3. Images go in `assets/` and are referenced as `../assets/name.png`.
4. Add a block to `writing: [` in `content.js` with `href: "writing/2026-11-short-title.html"` and `source: "armantik.com"`.
5. Commit and push.

Tip: inside `<pre><code>`, write `&lt;` instead of `<` and `&gt;` instead of `>`, so Java generics like `List<String>` show correctly.

### Services

The "How I can help" cards come from `services: [` in `content.js`. Each card has a title, one sentence and up to four points. The card titles are also listed in the Contact section, under the consulting line. `show.services: false` hides the section, that list and the consulting line together.

### Your email address and phone number

Neither is written anywhere as text, so spam bots and crawlers can't collect them. Both are stored as scrambled bytes (reversed, then XOR'ed with a key in `assets/site.js`) and put together in the browser only when a person is there:

- **Email** (`links.emailBytes` in `content.js`): every page shows a "Show email" link in its place, which turns into the address after the first tap, scroll or key press. Email me and Copy email work as usual.
- **Phone** (`C` in the script at the bottom of `card/index.html`, the only page that has it): the Call or text button says "Show number". The first tap shows the number, the second one calls. Save contact builds its contact file when it is tapped.

To change either one, open the browser console on any page of the site, run this with the new value, and paste the result into `emailBytes` or `C`:

```js
AA.scramble = function (s) { var K = [133, 28, 142, 76, 200]; return JSON.stringify(s.split("").map(function (c, i) { return c.charCodeAt(0) ^ K[i % K.length]; }).reverse()); };
AA.scramble("+46700000000")
```

Write the phone number with country code and no spaces. Set `emailBytes` or `C` to `[]` to hide that one.

### The How I help pages

Each page in `help/` has the same four parts: a one line summary, a "How I can help" paragraph with a short list, "The plan" (a numbered step diagram) and "Interested?" with the contact buttons. To change a step in the plan, edit its `<li>` inside `<ol class="plan">`: `s` is the step name, `d` what happens, `w` how long or when. Three to five steps fit best. `show.help: false` in `content.js` hides the links to these pages in the menus, on the home page and on the card.

### Hand-drawn icons

Every page uses the same marker style icons, drawn with rough.js: one per section in the left rail, a large one above the title of each inner page, and smaller ones on the Lab cards, the How I help tiles and rows, and the buttons. They are inline SVG, so their lines take the text color (dark on light, light on dark) and the scribble fill is petrol (styles: `.ico`, `.sec-ico`, `.page-ico` in `assets/style.css`). The Lab track icons on the home page and the Lab page come from `<template id="ico-...">` blocks near the bottom of those pages. All icons are shown on `/brand/`.

To use an icon somewhere new, copy its SVG from `tools/icons.json` and wrap it, for example `<span class="sec-ico" aria-hidden="true">...</span>` before a `/path` label. Copies with fixed colors for print and slides are in `assets/icons/`. To redraw or add one: `npm install roughjs`, edit the shapes in `tools/icons.js`, and run `node tools/icons.js assets/style.css`.

### A talk

Add a block to `talks: [` in `content.js` (title, date, event, href, summary). Turn on `show.talks`.

### A new Lab guide

1. Put the HTML file in `lab/`, for example `lab/consistent-hashing.html`.
2. Add a block to `lab: [` in `content.js`. `group` is one of `system-design`, `algorithms`, `java`. The home page card for that track updates by itself.
   For an algorithm, add the problem links (only the statement; the solution stays your own):
   ```js
   problems: [
     { site: "LeetCode", label: "70. Climbing Stairs", href: "https://leetcode.com/problems/climbing-stairs/" },
     { site: "NeetCode", href: "https://neetcode.io/problems/climbing-stairs" }
   ]
   ```
3. Optional: copy three things from the top of any existing guide so the new one matches: the `<script src="../assets/theme.js">` line, the `<style>` block that starts with `/* armantik.com bar`, and the `<nav class="aa-labbar">` line (plus the `<p class="aa-prob">` line for an algorithm). System design guides should not link to other sites.

## Hide and show

- **A whole section:** in `content.js`, set its switch under `show:` to `false` or `true`. Talks and the Persian name in the footer start switched off. (If you switch the Persian name on, add `&family=Vazirmatn:wght@500` to the Google Fonts link in each page for the nicest Persian type.)
- **One item:** add `hidden: true` to its block. Remove the line (or set `false`) to show it.
- **A link button:** leave its value empty in `links:` (for example `github: ""`) and the button disappears.
- **Check hidden things before going public:** open `https://armantik.com/?preview`. Hidden sections and items appear with a yellow "hidden" tag. Visitors without `?preview` never see them. (It is a convenience, not a secret: anyone who knows the trick can use it, so don't put anything private in the repo.)

## Light and dark theme

Every page, including each Lab guide, opens in the dark theme. The **Light / Dark** button in the header switches it; the visitor's choice is remembered in that browser and carries across pages. To change the default, edit `DEFAULT` at the top of `assets/theme.js` (`'dark'`, `'light'` or `'system'`). Dark colors are defined next to the light ones at the top of `assets/style.css`.

## Preview on your computer

Double-click `index.html`; it opens in your browser and works without a server. Or, for exact GitHub Pages behavior:

```bash
cd armantik.com
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages with armantik.com

One time setup:

1. Create a public repository on GitHub, for example `armantik.com`, and push these files to the `main` branch.
   ```bash
   cd armantik.com
   git init && git add . && git commit -m "First version of armantik.com"
   git branch -M main
   git remote add origin git@github.com:YOUR-USERNAME/armantik.com.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. Still in Settings → Pages, **Custom domain**: `armantik.com`. Save. (The `CNAME` file already contains it.)
4. In Cloudflare DNS for armantik.com, add these records with the proxy **off** (grey cloud, "DNS only"):
   - `A` record, name `@`, values `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (four records)
   - `CNAME` record, name `www`, target `YOUR-USERNAME.github.io`
5. Wait for GitHub to show the certificate as ready (minutes to an hour), then tick **Enforce HTTPS**.
6. Optional, later: turn the Cloudflare proxy on (orange cloud) and set SSL/TLS mode to **Full (strict)**.

After that, every `git push` to `main` updates the live site in about a minute.

## Edit with Claude Code

Open this folder in Claude Code and ask in plain words, for example:

- "Add my new Medium article to the site: <link>, published 2 Nov, one line summary: ..."
- "Turn this text into an article page on the site using writing/_template.html, and add it to content.js."
- "Add this HTML guide to the Lab under algorithms, with the armantik.com bar."
- "Switch on the writing section."

Claude Code can follow this README to do it.

## House rules for copy

- No dashes as punctuation. Use commas, colons, or "to" for ranges (2021 to 2023).
- No employer logos, and only public information about current and past employers.
- Describe yourself as an engineer who builds, writes and mentors.

## Colors

| Name   | Hex       | Use                                  |
|--------|-----------|--------------------------------------|
| Petrol | `#0F5C55` | accent, links, the mark, card stripe |
| Ink    | `#16211F` | main text                            |
| Paper  | `#FAFBF9` | background                           |
| Slate  | `#4A5855` | secondary text                       |
| Mist   | `#DCE3E0` | rules and borders                    |
| Wash   | `#E4EFEC` | tags, notes                          |
| Sea    | `#5BB8AA` | petrol on dark backgrounds           |
| Night  | `#0F1614` | dark mode background                 |

Fonts: Schibsted Grotesk (text, and headings at weight 600), JetBrains Mono (labels, dates, code), Vazirmatn (Persian). All on Google Fonts. Full details, with RGB and CMYK, at `/brand/`.
