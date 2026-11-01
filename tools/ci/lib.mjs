/* Shared helpers for the site checks in tools/ci. No dependencies beyond Node itself. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SITE_URL = "https://armantik.com";
export const GUIDE_PAGE = "lab/java-backend-guide.html";
export const GUIDE_DATA = "lab/data/java-backend-guide.js";

const SKIP_DIRS = new Set([".git", ".github", "node_modules"]);

/* Every file in the site, as paths relative to the repo root with forward slashes, sorted. */
export function listFiles(exts) {
  const out = [];
  (function walk(dir) {
    for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(d.name)) continue;
      const full = path.join(dir, d.name);
      if (d.isDirectory()) walk(full);
      else {
        const rel = path.relative(ROOT, full).split(path.sep).join("/");
        if (rel.startsWith("tools/ci/")) continue;
        if (!exts || exts.some((e) => rel.endsWith(e))) out.push(rel);
      }
    }
  })(ROOT);
  return out.sort();
}

export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
export const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

/* Runs a browser script (content.js, the guide data) in a sandbox and returns what it put on window. */
export function runWindowScript(rel) {
  const ctx = { window: {} };
  vm.runInNewContext(read(rel), ctx, { filename: rel });
  return ctx.window;
}
export const loadSite = () => runWindowScript("content.js").SITE || {};
export const loadGuide = () => runWindowScript(GUIDE_DATA).JAVA_GUIDE || [];

/* The email and phone number exactly as the site decodes them (assets/site.js), so the checks can make
   sure neither ever appears as plain text. Never print these values. */
export function contactDetails() {
  const siteJs = read("assets/site.js");
  const keyMatch = siteJs.match(/var KEY = (\[[\d,\s]*\])/);
  if (!keyMatch) return { email: "", phone: "", phoneBytes: null };
  const key = JSON.parse(keyMatch[1]);
  const unscramble = (bytes) => bytes.slice().reverse().map((c, i) => String.fromCharCode(c ^ key[i % key.length])).join("");
  const site = loadSite();
  const emailBytes = (site.links && site.links.emailBytes) || [];
  const card = exists("card/index.html") ? read("card/index.html") : "";
  const c = card.match(/var C = (\[[\d,\s]*\])/);
  return {
    email: emailBytes.length ? unscramble(emailBytes) : "",
    phone: c && JSON.parse(c[1]).length ? unscramble(JSON.parse(c[1])) : "",
    phoneBytes: c ? c[1] : null,
  };
}

/* A regular expression that finds a phone number written with or without spaces, dots, dashes or brackets,
   in international (+46 70...) or national (070...) form. */
export function phonePattern(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;
  const sep = "[\\s().\\-]*";
  const forms = [digits.split("").join(sep)];
  if (phone.trim().startsWith("+") && digits.startsWith("46")) forms.push(("0" + digits.slice(2)).split("").join(sep));
  return new RegExp("(?:" + forms.join("|") + ")");
}

/* Dashes used as punctuation in running text: an em or en dash, or a hyphen with a space on both sides.
   A cell or label holding only a dash (an empty value) is fine. Returns a short snippet, or null. */
export function dashInProse(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t || /^[–—-]$/.test(t)) return null;
  const snippet = (i) => t.slice(Math.max(0, i - 30), i + 31).trim();
  const em = t.search(/[–—]/);
  if (em >= 0) return snippet(em);
  /* a spaced hyphen between short operands is a minus sign (a - b, n - 1, len - 2), not a dash */
  const operand = (s) => /^[\w.()[\]]+$/.test(s) && (s.length <= 3 || /^\(?\d/.test(s));
  for (let i = t.indexOf(" - "); i >= 0; i = t.indexOf(" - ", i + 1)) {
    const left = t.slice(0, i).split(" ").pop(), right = t.slice(i + 3).split(" ")[0];
    if (!(operand(left) && operand(right))) return snippet(i);
  }
  return null;
}

/* Collects findings, prints them, adds GitHub annotations and a job summary, and sets the exit code. */
export class Report {
  constructor(title) { this.title = title; this.errors = []; this.warnings = []; this.notes = []; }
  error(file, message) { this.errors.push({ file, message }); }
  warn(file, message) { this.warnings.push({ file, message }); }
  note(message) { this.notes.push(message); }
  finish() {
    const gh = !!process.env.GITHUB_ACTIONS;
    const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    const prop = (s) => esc(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
    const line = (kind, f) => (gh
      ? `::${kind} ${f.file ? `file=${prop(f.file)},` : ""}title=${prop(this.title)}::${esc(f.message)}`
      : `${kind === "error" ? "ERROR" : "warn "}  ${f.file ? f.file + ": " : ""}${f.message}`);
    console.log(`\n== ${this.title} ==`);
    for (const n of this.notes) console.log("  " + n);
    for (const w of this.warnings) console.log(line("warning", w));
    for (const e of this.errors) console.log(line("error", e));
    const status = this.errors.length ? `${this.errors.length} error(s)` : "passed";
    console.log(`${this.title}: ${status}${this.warnings.length ? `, ${this.warnings.length} warning(s)` : ""}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const md = [`### ${this.errors.length ? "❌" : "✅"} ${this.title}: ${status}`, ""];
      for (const n of this.notes) md.push(`- ${n}`);
      for (const e of this.errors.slice(0, 50)) md.push(`- **Error** ${e.file ? "`" + e.file + "` " : ""}${e.message}`);
      for (const w of this.warnings.slice(0, 20)) md.push(`- Warning ${w.file ? "`" + w.file + "` " : ""}${w.message}`);
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join("\n") + "\n\n");
    }
    if (this.errors.length) process.exitCode = 1;
  }
}
