/* HTML validation for every page, with the rules in .htmlvalidate.json. Errors fail the build. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HtmlValidate, FileSystemConfigLoader, formatterFactory } from "html-validate";
import { ROOT, Report, listFiles } from "./lib.mjs";

const r = new Report("HTML validation");
/* the pages live elsewhere in the repo, so hand the validator this folder's config explicitly */
const here = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(here, ".htmlvalidate.json"), "utf8"));
delete config.$comment;
config.root = true;
config.elements = config.elements.map((e) => (e.startsWith("./") ? path.join(here, e) : e));
const loader = new FileSystemConfigLoader(config);
const htmlvalidate = new HtmlValidate(loader);
const pages = listFiles([".html"]);
const results = [];
for (const page of pages) {
  const report = await htmlvalidate.validateFile(path.join(ROOT, page));
  for (const res of report.results) {
    res.filePath = page;
    results.push(res);
    for (const m of res.messages) {
      const text = `line ${m.line}: ${m.message} (${m.ruleId})`;
      if (m.severity === 2) r.error(page, text); else r.warn(page, text);
    }
  }
}
const pretty = formatterFactory("stylish")(results);
if (pretty.trim() && !process.env.GITHUB_ACTIONS) console.log(pretty);
r.note(`Validated ${pages.length} pages.`);
r.finish();
