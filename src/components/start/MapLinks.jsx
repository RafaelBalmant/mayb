"use client";
import Link from "next/link";
import { t } from "../../content.js";
import { useNavigation } from "../../navigation/useNavigation.js";
import { PATHS } from "../../navigation/routes.js";
import { useStore } from "../../store/StoreProvider.jsx";

/** The real cases and face-map buttons of the start page, only while the map is on (MAP_ENABLED or ?mapa=1). */
export function MapLinks() {
  const { state } = useStore();
  const { goTo } = useNavigation();
  if (!state.features.map) return null;
  return (
    <>
      <Link className="btn" id="go-cases" data-track="cases_open" href={PATHS.cases}>
        {t("start.cases")}
      </Link>
      {/* a button, not a link: it always opens the flow at its start (opening), not where the visitor stopped */}
      <button className="btn" id="go-map" data-track="map_open" onClick={() => goTo("opening")}>
        {t("start.map")}
      </button>
    </>
  );
}
