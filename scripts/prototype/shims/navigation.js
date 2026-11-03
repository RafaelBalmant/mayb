// Stands in for next/navigation in the prototype page: the page lives in one HTML file, so each site page is a plain
// #name in the address ("" is the start page) instead of a path.
import { useSyncExternalStore } from "react";
import { PATHS } from "../../../src/navigation/routes.js";

const HASH_OF_PATH = { [PATHS.start]: "", [PATHS.agenda]: "agenda", [PATHS.cases]: "casos", [PATHS.flow]: "mapa" };

/** "/agenda/?x=1" → "agenda"; unknown paths go to the start page. */
export const hashOfPath = (path) => HASH_OF_PATH[path.split(/[?#]/)[0]] ?? "";

const currentPath = () =>
  Object.keys(HASH_OF_PATH).find((path) => HASH_OF_PATH[path] === location.hash.slice(1)) ?? PATHS.start;

function subscribe(onChange) {
  addEventListener("hashchange", onChange);
  return () => removeEventListener("hashchange", onChange);
}

function go(path, replace) {
  const target = `#${hashOfPath(path)}`;
  if (replace) location.replace(target);
  else location.hash = target;
  scrollTo(0, 0);
}

const router = { push: (path) => go(path, false), replace: (path) => go(path, true) };

export const useRouter = () => router;
export const usePathname = () => useSyncExternalStore(subscribe, currentPath, () => PATHS.start);
