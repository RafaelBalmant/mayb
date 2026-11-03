// Reads the real cases at build time: the list in data/cases.json (and the examples) plus the photo and audio files
// in public/cases/<folder>/ (public/case-examples/<folder>/). The pages get the finished list; visitors never list
// folders. Server only (Node's fs).
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { SHOW_CASE_EXAMPLES } from "../../config.js";
import examples from "../../data/case-examples.json";
import data from "../../data/cases.json";
import { loadCases, withExamples } from "../../domain/cases.js";

const PUBLIC = join(process.cwd(), "public");

/** { "cases/labios-01/antes.jpg": "/cases/labios-01/antes.jpg" } for every file in public/<root>/<folder>/. */
export function filesUnder(root, base = PUBLIC) {
  const files = {};
  let folders = [];
  try {
    folders = readdirSync(join(base, root), { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return files; // no folder yet: no cases
  }
  for (const folder of folders) {
    for (const name of readdirSync(join(base, root, folder.name))) {
      const path = `${root}/${folder.name}/${name}`;
      files[path] = `/${path}`;
    }
  }
  return files;
}

/** The cases to show: real ones, then the examples while SHOW_CASE_EXAMPLES is on. */
export const loadAllCases = () =>
  withExamples(
    loadCases(data.cases, filesUnder("cases")),
    loadCases(examples.cases, filesUnder("case-examples")),
    SHOW_CASE_EXAMPLES,
  );
