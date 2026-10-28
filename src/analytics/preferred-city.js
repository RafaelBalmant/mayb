import { CITY_KEY } from "../config.js";

// The city picked in the booking modal, kept so the next visit can send it again as the preferred_city user
// property (GA's own city, from the IP, often shows Siqueira Campos visitors as Londrina or Curitiba).

const CITY_CODE = /^[a-z_]{2,40}$/;

/** The saved city code, or null. */
export function readPreferredCity(storage) {
  try {
    const value = storage?.getItem(CITY_KEY);
    return CITY_CODE.test(value ?? "") ? value : null;
  } catch {
    return null;
  }
}

/** Saves the city code; a blocked storage only means it is not remembered for the next visit. */
export function savePreferredCity(storage, city) {
  try {
    storage?.setItem(CITY_KEY, city);
  } catch {
    // nothing to do
  }
}
