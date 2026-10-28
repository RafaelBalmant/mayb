import cases from "../data/cases.json";

/** Case photos by area code: [{ procedure, photos: [{ photo, caption? }] }]. Codes starting with "_" are notes. */
export const CASES = cases;

/** Marked areas that have an entry in cases.json ("other" has none), in marking order. */
export const partsWithCases = (areas) => areas.map((a) => a.code).filter((code) => Array.isArray(CASES[code]));

/** Photos always alternate: before, after, before, after… (even index = before). */
export const isAfter = (index) => index % 2 === 1;

/** Number of before/after cases in a list of procedures. */
export const countCases = (procedures) => procedures.reduce((n, p) => n + Math.ceil(p.photos.length / 2), 0);
