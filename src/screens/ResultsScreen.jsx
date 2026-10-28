import { useCallback, useState } from "preact/hooks";
import { AREA_BY_CODE, t, tn } from "../content.js";
import { PLACEHOLDER_PHOTOS } from "../config.js";
import { CASES, countCases, isAfter, partsWithCases } from "../domain/cases.js";
import { Layout } from "../components/Layout.jsx";
import { PhotoViewer } from "../components/PhotoViewer.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

const moment = (i) => t(isAfter(i) ? "results.after" : "results.before");

// The photos live in public/cases/ (the list, by part and procedure, is in data/cases.json).
const photoUrl = (file) => `${import.meta.env.BASE_URL}cases/${file}`;

const Placeholders = () =>
  Array.from({ length: PLACEHOLDER_PHOTOS }, (_, i) => (
    <figure key={i}>
      <span class="moment">{moment(i)}</span>
      <div class="photo placeholder" aria-hidden="true">
        <span>{t("results.comingSoon")}</span>
      </div>
    </figure>
  ));

// Right after the map: invites the visitor to see photos of real cases, in one card per marked part;
// inside each card the photos are split by procedure. Only parts present in cases.json get a card
// ("Other part" has none). It can be skipped.
export function ResultsScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const parts = partsWithCases(state.areas);
  const openCode = parts.includes(state.ui.openCase) ? state.ui.openCase : null;
  const [viewer, setViewer] = useState(null);
  const closeViewer = useCallback(() => setViewer(null), []);

  const bar = (
    <>
      <button class="btn secondary" id="back" onClick={() => goTo("map")}>
        {t("general.back")}
      </button>
      <button class="btn primary" id="skip" onClick={() => goTo("next")}>
        {t(state.ui.viewedCases ? "results.continue" : "results.skip")}
      </button>
    </>
  );

  return (
    <>
      <Layout bar={bar}>
        <Topbar screen="results" />
        <div class="block snug">
          <h1>{t("results.title")}</h1>
          <p class="sub">{t(parts.length ? "results.explanation" : "results.none")}</p>
        </div>
        <div class="case-cards">
          {parts.map((code) => {
            const procedures = CASES[code];
            const isOpen = openCode === code;
            const name = AREA_BY_CODE[code].name;
            const cases = countCases(procedures);
            return (
              <section key={code} class={isOpen ? "case-card open" : "case-card"} data-code={code}>
                <button
                  class="case-card-top"
                  aria-expanded={isOpen}
                  aria-controls={`photos-${code}`}
                  onClick={() => dispatch({ type: "TOGGLE_CASE", code })}
                >
                  <strong>{name}</strong>
                  <span>{cases ? tn("results.photos", cases) : t("results.comingSoon")}</span>
                  <i aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </i>
                </button>
                <div class="gallery" id={`photos-${code}`} hidden={!isOpen}>
                  {procedures.length ? (
                    procedures.map((p) => (
                      <section key={p.procedure} class="procedure">
                        <h3>{p.procedure}</h3>
                        <div class="photos">
                          {p.photos.length ? (
                            p.photos.map((c, i) => {
                              const vars = { moment: moment(i), procedure: p.procedure, area: name };
                              return (
                                <figure key={c.photo}>
                                  <span class="moment">{moment(i)}</span>
                                  <button
                                    class="photo"
                                    aria-label={t("results.openPhoto", vars)}
                                    onClick={(e) =>
                                      setViewer({
                                        photo: c,
                                        label: `${moment(i)} · ${p.procedure}`,
                                        origin: e.currentTarget,
                                      })
                                    }
                                  >
                                    <img
                                      src={photoUrl(c.photo)}
                                      alt={c.caption || t("results.photo", vars)}
                                      loading="lazy"
                                    />
                                  </button>
                                  {c.caption && <figcaption>{c.caption}</figcaption>}
                                </figure>
                              );
                            })
                          ) : (
                            <Placeholders />
                          )}
                        </div>
                      </section>
                    ))
                  ) : (
                    <>
                      <p class="sub">{t("results.noPhotos")}</p>
                      <div class="photos">
                        <Placeholders />
                      </div>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {parts.length > 0 && <p class="sub note">{t("results.notice")}</p>}
      </Layout>
      {viewer && (
        <PhotoViewer
          src={photoUrl(viewer.photo.photo)}
          label={viewer.label}
          caption={viewer.photo.caption}
          origin={viewer.origin}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
