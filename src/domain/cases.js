import data from "../data/cases.json";
import { areas } from "../content.js";

/** Area codes that can have cases, in face order (top to bottom). "Other part" has none. */
export const CASE_AREAS = areas.map((a) => a.code).filter((code) => code !== "other");

// Every file inside src/cases/<folder>/, found at build time: { "../cases/labios-01/antes.jpg": url }.
const FILES = import.meta.glob("../cases/*/*.*", { eager: true, query: "?url", import: "default" });

const IMAGE = /\.(jpe?g|png|webp)$/i;

/** Files grouped by case folder, with lower-case names: { "labios-01": { "antes.jpg": url } }. */
export function filesByFolder(files) {
  const out = {};
  for (const [path, url] of Object.entries(files)) {
    const [folder, name] = path.split("/").slice(-2);
    (out[folder] ??= {})[name.toLowerCase()] = url;
  }
  return out;
}

// The photo named antes / antes-2 / … (any image extension), or undefined.
const photo = (folderFiles, moment, n) => {
  const base = n === 1 ? [moment, `${moment}-1`] : [`${moment}-${n}`];
  const name = Object.keys(folderFiles).find((f) => IMAGE.test(f) && base.includes(f.replace(IMAGE, "")));
  return name && folderFiles[name];
};

/** Before/after pairs of a folder: antes + depois, then antes-2 + depois-2… until one of the two is missing. */
export function pairsOf(folderFiles = {}) {
  const pairs = [];
  for (let n = 1; ; n++) {
    const before = photo(folderFiles, "antes", n);
    const after = photo(folderFiles, "depois", n);
    if (!before || !after) return pairs;
    pairs.push({ before, after });
  }
}

/**
 * Cases ready to show, in the order of cases.json: visible ones whose folder has at least one before/after pair.
 * Each one: { folder, title, areas, procedures, after?, description?, audio (url or null), audioText?, pairs }.
 */
export function loadCases(list, files) {
  const folders = filesByFolder(files);
  return list
    .filter((c) => c.visible !== false)
    .map((c) => {
      const own = folders[c.folder] ?? {};
      return {
        ...c,
        procedures: c.procedures ?? [],
        areas: CASE_AREAS.filter((code) => c.areas.includes(code)), // face order
        audio: (c.audio && own[c.audio.toLowerCase()]) || null,
        pairs: pairsOf(own),
      };
    })
    .filter((c) => c.pairs.length > 0);
}

export const CASES = loadCases(data.cases, FILES);

/** Cases that include an area. */
export const casesOf = (code, cases = CASES) => cases.filter((c) => c.areas.includes(code));

/** Areas that have at least one case, in face order. */
export const areasWithCases = (cases = CASES) => CASE_AREAS.filter((code) => casesOf(code, cases).length > 0);

/**
 * The cases of the chosen areas, one group per area in face order. A case with several areas shows only once,
 * in the first chosen area it belongs to; an area left without cases is dropped.
 */
export function groupByArea(chosen, cases = CASES) {
  const shown = new Set();
  return CASE_AREAS.filter((code) => chosen.includes(code))
    .map((code) => {
      const own = casesOf(code, cases).filter((c) => !shown.has(c));
      own.forEach((c) => shown.add(c));
      return { code, cases: own };
    })
    .filter((g) => g.cases.length > 0);
}

/** Marked areas that get a card on the results step, in marking order. */
export const partsWithCases = (marked) => marked.map((a) => a.code).filter((code) => CASE_AREAS.includes(code));
