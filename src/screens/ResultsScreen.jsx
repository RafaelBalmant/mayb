import { useCallback, useState } from "react";
import { AREA_BY_CODE, t, tn } from "../content.js";
import { PLACEHOLDER_PHOTOS } from "../config.js";
import { casesOf, partsWithCases } from "../domain/cases.js";
import { CaseCard } from "../components/CaseCard.jsx";
import { useCases } from "../components/CasesContext.jsx";
import { Layout } from "../components/Layout.jsx";
import { PhotoViewer } from "../components/PhotoViewer.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useNavigation } from "../navigation/useNavigation.js";
import { useStore } from "../store/StoreProvider.jsx";

// Empty frames while a part has no case yet: before above after, like a real case.
const Placeholders = () => (
  <div className="case-pair">
    {Array.from({ length: PLACEHOLDER_PHOTOS }, (_, i) => (
      <figure key={i}>
        <span className="moment">{t(i % 2 ? "cases.after" : "cases.before")}</span>
        <div className="photo placeholder" aria-hidden="true">
          <span>{t("results.comingSoon")}</span>
        </div>
      </figure>
    ))}
  </div>
);

// Right after the map: invites the visitor to see photos of real cases, in one card per marked part;
// inside each card, the cases of that part (data/cases.json). "Other part" gets no card. It can be skipped.
export function ResultsScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const allCases = useCases();
  const parts = partsWithCases(state.areas);
  const openCode = parts.includes(state.ui.openCase) ? state.ui.openCase : null;
  const [viewer, setViewer] = useState(null);
  const closeViewer = useCallback(() => setViewer(null), []);

  const bar = (
    <>
      <button className="btn secondary" id="back" onClick={() => goTo("map")}>
        {t("general.back")}
      </button>
      <button className="btn primary" id="skip" onClick={() => goTo("next")}>
        {t(state.ui.viewedCases ? "results.continue" : "results.skip")}
      </button>
    </>
  );

  return (
    <>
      <Layout bar={bar}>
        <Topbar screen="results" />
        <div className="block snug">
          <h1>{t("results.title")}</h1>
          <p className="sub">{t(parts.length ? "results.explanation" : "results.none")}</p>
        </div>
        <div className="case-cards">
          {parts.map((code) => {
            const cases = casesOf(code, allCases);
            const isOpen = openCode === code;
            const name = AREA_BY_CODE[code].name;
            return (
              <section key={code} className={isOpen ? "case-card open" : "case-card"} data-code={code}>
                <button
                  className="case-card-top"
                  aria-expanded={isOpen}
                  aria-controls={`photos-${code}`}
                  onClick={() => dispatch({ type: "TOGGLE_CASE", code })}
                >
                  <strong>{name}</strong>
                  <span>{cases.length ? tn("results.photos", cases.length) : t("results.comingSoon")}</span>
                  <i aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </i>
                </button>
                <div className="gallery" id={`photos-${code}`} hidden={!isOpen}>
                  {cases.length ? (
                    cases.map((item) => <CaseCard key={item.folder} item={item} onOpen={setViewer} />)
                  ) : (
                    <>
                      <p className="sub">{t("results.noPhotos")}</p>
                      <Placeholders />
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {parts.length > 0 && <p className="sub note">{t("results.notice")}</p>}
      </Layout>
      {viewer && <PhotoViewer {...viewer} onClose={closeViewer} />}
    </>
  );
}
