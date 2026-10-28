import content from "./data/content.json";

export const { professional, areas, labels, faq, texts } = content;

/** Area by code. */
export const AREA_BY_CODE = Object.fromEntries(areas.map(a => [a.code, a]));

/** Name without the explanation in parentheses. */
export const shortName = code => AREA_BY_CODE[code].name.replace(/ \(.+\)$/, "");

/**
 * Site text: t("map.empty"), t("general.step", { current: 3, total: 8, title: "…" }).
 * Every text shown to the visitor comes from data/content.json (section "texts").
 */
export function t(key, vars = {}) {
  const value = key.split(".").reduce((o, k) => o?.[k], texts);
  if (value === undefined) {
    console.warn(`Text not found in content.json: texts.${key}`);
    return key;
  }
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

/** Text with singular/plural: { "one": "...", "many": "... {n} ..." }. */
export const tn = (key, n, vars = {}) => t(`${key}.${n === 1 ? "one" : "many"}`, { n, ...vars });
