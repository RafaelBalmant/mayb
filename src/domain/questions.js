import questions from "../data/questions.json";

export const FIELDS = questions.fields;
export const QUESTIONS = questions.questions;

/** A new, unanswered area. The fields and their defaults come from data/questions.json. */
export function newArea(code) {
  const empty = Object.fromEntries(Object.entries(FIELDS).map(([name, f]) => [name, structuredClone(f.default)]));
  return { code, ...empty };
}

const isFilled = (value, mode) => {
  if (Array.isArray(value)) return value.length > 0;
  if (mode === "trimmed") return Boolean(String(value).trim());
  return Boolean(value);
};

/** True if the visitor answered at least one question of the area. */
export const hasAnswers = area =>
  Object.entries(FIELDS).some(([name, f]) => f.answer && isFilled(area[name], f.answer));
