/* Optional guard: the public Java guide must not reveal the questions of the private interview bank.
   The bank never lives in this repository. It comes from the INTERVIEW_BANK secret (gzip + base64 of a JSON
   array of { q, k, r, f } strings: question, key points, red flags, follow-ups). Without the secret the check
   is skipped. Findings name only the guide question and field, never the bank's text, because CI logs can
   be public. */
import zlib from "node:zlib";
import { Report, loadGuide, GUIDE_DATA } from "./lib.mjs";

const r = new Report("Interview bank guard");
const raw = (process.env.INTERVIEW_BANK || "").trim();
if (!raw) {
  r.note("Skipped: the INTERVIEW_BANK secret is not set (pull requests from forks never get it).");
  r.finish();
  process.exit();
}

let bank;
try { bank = JSON.parse(zlib.gunzipSync(Buffer.from(raw, "base64")).toString("utf8")); }
catch { r.error("", "the INTERVIEW_BANK secret could not be decoded (expected gzip + base64 JSON)"); r.finish(); process.exit(); }

const STOP = new Set("a an the and or of to in on for is it be do you how what when why which would should can does with from by as at this that are your we they".split(" "));
const tokens = (s) => String(s || "").toLowerCase().replace(/[`*]/g, "").match(/[a-z0-9.+#()<>]+/g) || [];
const shingles = (s, k) => { const t = tokens(s), out = new Set(); for (let i = 0; i + k <= t.length; i++) out.add(t.slice(i, i + k).join(" ")); return out; };
const meaningful = (g) => g.split(" ").filter((w) => !STOP.has(w)).length >= 3;
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const bankTitles = new Set(bank.map((b) => norm(b.q)));
const bank5 = new Set(), bank6 = new Set();
for (const b of bank) {
  const all = [b.q, b.k, b.r, b.f].join(" | ");
  shingles(all, 5).forEach((g) => bank5.add(g));
  shingles(all, 6).forEach((g) => bank6.add(g));
}

const guide = loadGuide();
let flagged = 0;
for (const x of guide) {
  if (bankTitles.has(norm(x.question))) { r.error(GUIDE_DATA, `question #${x.id}: the title is identical to a bank question`); flagged++; continue; }
  const headline = [["title", x.question]].concat(x.keyPoints.map((s) => ["key points", s]), x.redFlags.map((s) => ["weak answer signs", s]), x.followUps.map((f) => ["follow-up questions", f.q]));
  const hitFields = new Set();
  for (const [field, s] of headline) for (const g of shingles(s, 5)) if (bank5.has(g) && meaningful(g)) hitFields.add(field);
  const body = [x.tldr].concat(x.answer, x.extra, x.examples.map((e) => e.note || ""), x.followUps.map((f) => f.a)).join(" | ");
  for (const g of shingles(body, 6)) if (bank6.has(g) && meaningful(g)) { hitFields.add("answer text"); break; }
  if (hitFields.size) { r.error(GUIDE_DATA, `question #${x.id}: wording in ${[...hitFields].join(", ")} matches the bank; reword it`); flagged++; }
}
r.note(`Compared ${guide.length} guide questions with ${bank.length} bank questions; ${flagged} need rewording.`);
r.finish();
