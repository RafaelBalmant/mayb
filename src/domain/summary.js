import { AREA_BY_CODE, optionLabel, professional, labels, t } from "../content.js";
import { FREE_TEXT_SHRINK, NAME_MAX_LENGTH, WHATSAPP_BASE_URL } from "../config.js";

/**
 * Areas block in the WhatsApp format (flow doc); labels come from texts.summary.
 * Skipped fields do not appear. Order: by discomfort level; ties keep the order in which they were marked.
 * `max` shortens free texts (so the message fits the link limit).
 */
export function formatAreas(areas, max = Infinity) {
  const weight = (a) => a.intensity || 0;
  const ordered = areas
    .map((a, i) => [a, i])
    .sort((x, y) => weight(y[0]) - weight(x[0]) || x[1] - y[1])
    .map(([a]) => a);
  const r = (key, vars) => t(`summary.${key}`, vars);
  const free = (s) => truncate(s.trim(), max);

  const lines = [r("title", { n: ordered.length })];
  ordered.forEach((a, i) => {
    lines.push("", r("area", { i: i + 1, area: AREA_BY_CODE[a.code].name }));
    if (a.code === "other" && a.description.trim()) lines.push(r("otherDescription", { text: free(a.description) }));
    const concerns = [...a.concerns.map((id) => optionLabel(a.code, id).toLowerCase()), free(a.concernsOther)].filter(
      Boolean,
    );
    if (concerns.length) lines.push(r("concerns", { text: concerns.join(", ") }));
    if (a.side) lines.push(r("side", { text: labels.side[a.side].toLowerCase() }));
    if (a.since) lines.push(r("since", { text: labels.since[a.since].toLowerCase() }));
    if (a.intensity) lines.push(r("intensity", { n: a.intensity }));
    if (a.appearsWhen && AREA_BY_CODE[a.code].movement)
      lines.push(r("appearsWhen", { text: labels.appearsWhen[a.appearsWhen].toLowerCase() }));
    if (a.procedure) {
      const detail =
        a.procedure === "yes" && a.procedureDetail.trim()
          ? r("procedureDetail", { text: free(a.procedureDetail) })
          : "";
      lines.push(r("procedure", { text: labels.procedure[a.procedure].toLowerCase() }) + detail);
    }
    if (a.comment.trim()) lines.push(r("comment", { text: free(a.comment) }));
  });
  return lines.join("\n");
}

const truncate = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s);

/**
 * The whole WhatsApp message: greeting, personal data, areas and footer (texts.message).
 * If it exceeds the limit (professional.messageLimit), free texts are progressively shortened.
 */
export function buildMessage(state) {
  const m = (key, vars) => t(`message.${key}`, vars);
  const name = state.about.name.trim();
  const build = (max) =>
    [
      m("greeting"),
      ...(name ? ["", m("name", { text: truncate(name, NAME_MAX_LENGTH) })] : []),
      "",
      formatAreas(state.areas, max),
      "",
      m("footer", { professional: professional.name }),
    ].join("\n");

  let text = build(Infinity);
  const { start, step, min } = FREE_TEXT_SHRINK;
  for (let max = start; text.length > professional.messageLimit && max >= min; max -= step) text = build(max);
  return text;
}

/** wa.me link with the message already filled in. */
export const whatsappLink = (text) => `${WHATSAPP_BASE_URL}${professional.whatsapp}?text=${encodeURIComponent(text)}`;
