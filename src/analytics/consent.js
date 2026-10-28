import { CONSENT_KEY } from "../config.js";

/** The visitor's answer to the cookie notice; null while they have not answered. */
export const CONSENT = { granted: "granted", denied: "denied" };

const VALID = new Set(Object.values(CONSENT));

/** The saved answer, or null (also when the storage is blocked). */
export function readConsent(storage) {
  try {
    const value = storage?.getItem(CONSENT_KEY);
    return VALID.has(value) ? value : null;
  } catch {
    return null;
  }
}

/** Saves the answer; a blocked storage only means the notice shows again on the next visit. */
export function saveConsent(storage, value) {
  try {
    storage?.setItem(CONSENT_KEY, value);
  } catch {
    // nothing to do
  }
}
