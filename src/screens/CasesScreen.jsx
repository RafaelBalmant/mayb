"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAnalytics } from "../analytics/AnalyticsProvider.jsx";
import { AREA_BY_CODE, t, tn } from "../content.js";
import { areasWithCases, casesOf, groupByArea } from "../domain/cases.js";
import { Brand } from "../components/Brand.jsx";
import { CaseCard } from "../components/CaseCard.jsx";
import { useCases } from "../components/CasesContext.jsx";
import { Layout } from "../components/Layout.jsx";
import { PhotoViewer } from "../components/PhotoViewer.jsx";
import { PATHS } from "../navigation/routes.js";
import { useMapGate } from "../navigation/useMapGate.js";

const sectionId = (code) => `casos-${code}`;

// Real cases page (from the start page): the visitor picks one or more parts of the face (or all of them) and the
// cases show below, one section per part in face order, with the before photo above the after one.
// Behind the same switch as the face map (?mapa=1).
export function CasesScreen() {
  const open = useMapGate();
  const { trackScreen } = useAnalytics();
  const cases = useCases();
  const available = areasWithCases(cases);
  const [chosen, setChosen] = useState([]);
  const [viewer, setViewer] = useState(null);
  const closeViewer = useCallback(() => setViewer(null), []);

  const allChosen = available.length > 0 && available.every((code) => chosen.includes(code));
  const toggle = (code) =>
    setChosen((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  const toggleAll = () => setChosen(allChosen ? [] : available);
  const groups = groupByArea(chosen, cases);
  useEffect(() => {
    if (open) trackScreen("cases");
  }, [open, trackScreen]);
  if (!open) return null;

  const bar = (
    <>
      <Link className="btn secondary" id="back" href={PATHS.start}>
        {t("cases.back")}
      </Link>
      <Link className="btn primary" id="go-agenda" data-track="agenda_open" href={PATHS.agenda}>
        {t("cases.agenda")}
      </Link>
    </>
  );

  return (
    <>
      <Layout bar={bar}>
        <header className="topbar">
          <Brand />
        </header>
        <div className="block snug">
          <h1>{t("cases.title")}</h1>
          <p className="sub">{t(available.length ? "cases.explanation" : "cases.none")}</p>
        </div>
        {available.length > 0 && (
          <>
            <div className="case-chips" role="group" aria-label={t("cases.areas")}>
              <button className="case-chip" id="cases-all" aria-pressed={allChosen} onClick={toggleAll}>
                {t("cases.all")}
              </button>
              {available.map((code) => (
                <button
                  key={code}
                  className="case-chip"
                  aria-pressed={chosen.includes(code)}
                  onClick={() => toggle(code)}
                >
                  {AREA_BY_CODE[code].name} <small>{casesOf(code, cases).length}</small>
                </button>
              ))}
            </div>
            <p className="sub note">{t("results.notice")}</p>
          </>
        )}
        {groups.length > 1 && (
          <nav className="case-jump" aria-label={t("cases.jump")}>
            {groups.map(({ code }) => (
              <button
                key={code}
                onClick={() => document.getElementById(sectionId(code))?.scrollIntoView({ behavior: "smooth" })}
              >
                {AREA_BY_CODE[code].name}
              </button>
            ))}
          </nav>
        )}
        {available.length > 0 && groups.length === 0 && <p className="case-empty">{t("cases.pick")}</p>}
        {groups.map(({ code, cases }) => {
          const name = AREA_BY_CODE[code].name;
          return (
            <section key={code} className="case-group" id={sectionId(code)} data-code={code}>
              <div className="case-group-head">
                <h2>{name}</h2>
                <span>{tn("cases.count", cases.length)}</span>
              </div>
              {cases.map((item) => (
                <CaseCard key={item.folder} item={item} onOpen={setViewer} />
              ))}
              <p className="case-group-end">{t("cases.end", { area: name.toLowerCase() })}</p>
            </section>
          );
        })}
      </Layout>
      {viewer && <PhotoViewer {...viewer} onClose={closeViewer} />}
    </>
  );
}
