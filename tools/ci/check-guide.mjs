/* Checks for the Senior Java Backend Guide (lab/data/java-backend-guide.js and the pages that describe it).
   1. Every entry has the expected fields and types, ids run 1, 2, 3 ... with no gaps, titles are unique.
   2. Topics are contiguous, and inside each topic the Basic questions come before the Advanced ones.
   3. Text renders cleanly: balanced `code` spans, bold that does not wrap code, no dashes as punctuation.
   4. Every count shown to people matches the data: page title, search tags, structured data, the header,
      the Lab card in content.js and any link that says "N ... questions". */
import { load } from "cheerio";
import { Report, read, exists, loadGuide, loadSite, listFiles, dashInProse, GUIDE_PAGE, GUIDE_DATA } from "./lib.mjs";

const r = new Report("Java guide checks");
const KEYS = ["id", "category", "question", "level", "tldr", "answer", "keyPoints", "examples", "followUps", "extra", "redFlags"];
const LEVELS = ["Basic", "Advanced"];
const LANGS = ["java", "sql", "yaml", "bash", "http", "json", "text", "properties", "dockerfile"];

let data = [];
try { data = loadGuide(); } catch (e) { r.error(GUIDE_DATA, `could not be loaded: ${e.message}`); }
if (!Array.isArray(data) || !data.length) { r.error(GUIDE_DATA, "has no questions (window.JAVA_GUIDE is empty)"); r.finish(); process.exit(); }

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const strList = (v, min) => Array.isArray(v) && v.length >= min && v.every(isStr);
const at = (x) => `#${x && x.id}`;

/* 1. shape */
const titles = new Map();
const idProblems = data.map((x, i) => (x && x.id !== i + 1 ? `entry ${i + 1} has id ${x && x.id}` : null)).filter(Boolean);
if (idProblems.length) r.error(GUIDE_DATA, `ids must run 1, 2, 3 ... in order: ${idProblems.slice(0, 3).join("; ")}${idProblems.length > 3 ? `; and ${idProblems.length - 3} more` : ""}`);
data.forEach((x, i) => {
  const where = `question ${at(x)}`;
  const keys = Object.keys(x || {});
  const missing = KEYS.filter((k) => !keys.includes(k)), extra = keys.filter((k) => !KEYS.includes(k));
  if (missing.length) r.error(GUIDE_DATA, `${where} is missing ${missing.join(", ")}`);
  if (extra.length) r.error(GUIDE_DATA, `${where} has unknown fields ${extra.join(", ")} (difficulty and mustKnow were replaced by level)`);
  if (!LEVELS.includes(x.level)) r.error(GUIDE_DATA, `${where} has level "${x.level}"; use Basic or Advanced`);
  for (const k of ["category", "question", "tldr"]) if (!isStr(x[k])) r.error(GUIDE_DATA, `${where} has an empty ${k}`);
  if (!strList(x.answer, 1)) r.error(GUIDE_DATA, `${where} needs at least one answer paragraph`);
  if (!strList(x.keyPoints, 1)) r.error(GUIDE_DATA, `${where} needs at least one key point`);
  if (!Array.isArray(x.extra) || !x.extra.every(isStr)) r.error(GUIDE_DATA, `${where} has an invalid extra list`);
  if (!Array.isArray(x.redFlags) || !x.redFlags.every(isStr)) r.error(GUIDE_DATA, `${where} has an invalid redFlags list`);
  if (!Array.isArray(x.examples) || !x.examples.length) r.error(GUIDE_DATA, `${where} needs at least one code example`);
  else x.examples.forEach((e, j) => {
    if (!isStr(e.title) || !isStr(e.code)) r.error(GUIDE_DATA, `${where}, example ${j + 1} needs a title and code`);
    if (!LANGS.includes(e.lang)) r.error(GUIDE_DATA, `${where}, example ${j + 1} has language "${e.lang}"; the page knows ${LANGS.join(", ")}`);
  });
  if (!Array.isArray(x.followUps)) r.error(GUIDE_DATA, `${where} has an invalid followUps list`);
  else x.followUps.forEach((f, j) => { if (!isStr(f.q) || !isStr(f.a)) r.error(GUIDE_DATA, `${where}, follow-up ${j + 1} needs a question and an answer`); });
  const norm = String(x.question || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (titles.has(norm)) r.error(GUIDE_DATA, `${where} has the same title as #${titles.get(norm)}`); else titles.set(norm, x.id);
});

/* 2. order: topics in one block each, Basic before Advanced inside a topic */
const topics = [];
data.forEach((x, i) => {
  if (!topics.includes(x.category)) topics.push(x.category);
  else if (data[i - 1].category !== x.category) r.error(GUIDE_DATA, `question ${at(x)} (${x.category}) is separated from the rest of its topic`);
  const prev = data[i - 1];
  if (prev && prev.category === x.category && prev.level === "Advanced" && x.level === "Basic") r.error(GUIDE_DATA, `question ${at(x)} is Basic but comes after an Advanced question in ${x.category}`);
});

/* 3. text that the page renders */
let textIssues = 0;
data.forEach((x) => {
  const fields = [["question", x.question], ["tldr", x.tldr]]
    .concat((x.answer || []).map((s, i) => [`answer ${i + 1}`, s]), (x.keyPoints || []).map((s) => ["key point", s]),
      (x.extra || []).map((s) => ["worth knowing", s]), (x.redFlags || []).map((s) => ["weak answer sign", s]),
      (x.examples || []).flatMap((e) => [["example title", e.title], ["example note", e.note || ""]]),
      (x.followUps || []).flatMap((f) => [["follow-up", f.q], ["follow-up answer", f.a]]));
  for (const [name, s] of fields) {
    if (typeof s !== "string") continue;
    const parts = s.split("`");
    const report = (msg) => { if (textIssues++ < 40) r.error(GUIDE_DATA, `question ${at(x)}, ${name}: ${msg}`); };
    if (parts.length % 2 === 0) report("has an unmatched ` (inline code is not closed)");
    const outside = parts.filter((_, i) => i % 2 === 0);
    if (outside.some((p) => (p.match(/\*\*/g) || []).length % 2)) report("has ** bold that is not closed, or that wraps inline code (it would show raw asterisks)");
    const hit = dashInProse(outside.join(" "));
    if (hit) report(`dash used as punctuation: "${hit}"`);
  }
});
if (textIssues > 40) r.error(GUIDE_DATA, `${textIssues - 40} more text problems not listed`);

/* 4. counts shown to people */
const N = data.length, T = topics.length, B = data.filter((x) => x.level === "Basic").length, A = N - B;
const expect = (file, label, found, want) => {
  if (found === null || found === undefined) r.error(file, `could not find the ${label} (expected ${want})`);
  else if (String(found) !== String(want)) r.error(file, `${label} says ${found}, but the data has ${want}`);
};
const num = (s, re) => { const m = String(s || "").match(re); return m ? Number(m[1]) : null; };
if (exists(GUIDE_PAGE)) {
  const $ = load(read(GUIDE_PAGE));
  expect(GUIDE_PAGE, "page title", num($("title").text(), /(\d+)\s+with Answers/i) ?? num($("title").text(), /(\d+)\s+questions/i), N);
  expect(GUIDE_PAGE, "meta description", num($('meta[name="description"]').attr("content"), /(\d+)\s/), N);
  expect(GUIDE_PAGE, "og:description", num($('meta[property="og:description"]').attr("content"), /(\d+)\s/), N);
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  if (/\d/.test(ogTitle)) expect(GUIDE_PAGE, "og:title", num(ogTitle, /(\d+)/), N);
  $('script[type="application/ld+json"]').each((_, el) => {
    let ld; try { ld = JSON.parse($(el).html()); } catch { return; }
    const nodes = ld["@graph"] || [ld];
    for (const n of nodes) {
      if (n["@type"] === "LearningResource") {
        if (/\d/.test(n.name || "")) expect(GUIDE_PAGE, "structured data name", num(n.name, /(\d+)/), N);
        if (/\d/.test(n.description || "")) expect(GUIDE_PAGE, "structured data description", num(n.description, /(\d+)/), N);
      }
      for (const item of n.itemListElement || []) if (/java-backend-guide/.test(item.item || "") && /\d/.test(item.name || "")) expect(GUIDE_PAGE, "breadcrumb name", num(item.name, /(\d+)/), N);
    }
  });
  expect(GUIDE_PAGE, "header question count", num($("#jg-total").text(), /(\d+)/), N);
  expect(GUIDE_PAGE, "header topic count", num($("#jg-topics").text(), /(\d+)/), T);
  const split = $("#jg-split").text();
  expect(GUIDE_PAGE, "header Basic count", num(split, /(\d+)\s+basic/i), B);
  expect(GUIDE_PAGE, "header Advanced count", num(split, /(\d+)\s+advanced/i), A);
  const intro = $(".page-head p").filter((_, el) => /questions/i.test($(el).text()) && !$(el).hasClass("coords") && !$(el).hasClass("crumb")).first().text();
  expect(GUIDE_PAGE, "intro paragraph count", num(intro, /(\d+)\s+questions/i), N);
  const html = read(GUIDE_PAGE);
  if (/difficulty|mustKnow|must know/i.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ""))) r.error(GUIDE_PAGE, "still mentions difficulty or must know");
}
try {
  const card = (loadSite().lab || []).find((g) => /java-backend-guide/.test(g.href || ""));
  if (!card) r.warn("content.js", "has no Lab entry for the Java guide");
  else {
    expect("content.js", "Lab card summary", num(card.summary, /(\d+)\s+questions/i), N);
    const tags = card.tags || [];
    const qTag = tags.find((t) => /questions/i.test(t)), tTag = tags.find((t) => /topics/i.test(t));
    if (qTag) expect("content.js", "Lab card question tag", num(qTag, /(\d+)/), N);
    if (tTag) expect("content.js", "Lab card topic tag", num(tTag, /(\d+)/), T);
  }
} catch (e) { r.error("content.js", `could not be loaded: ${e.message}`); }
for (const page of listFiles([".html"]).filter((p) => p !== GUIDE_PAGE)) {
  const $ = load(read(page));
  $('a[href*="java-backend-guide"]').each((_, el) => {
    const n = num($(el).text(), /(\d+)\s+(?:[\w-]+\s+){0,4}questions/i);
    if (n !== null) expect(page, `link text "${$(el).text().trim()}"`, n, N);
  });
}

r.note(`${N} questions in ${T} topics: ${B} Basic, ${A} Advanced.`);
r.finish();
