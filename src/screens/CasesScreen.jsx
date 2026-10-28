import { useCallback, useState } from "preact/hooks";
import { AREA_BY_CODE, t, tn } from "../content.js";
import { areasWithCases, casesOf, groupByArea } from "../domain/cases.js";
import { Brand } from "../components/Brand.jsx";
import { CaseCard } from "../components/CaseCard.jsx";
import { Layout } from "../components/Layout.jsx";
import { PhotoViewer } from "../components/PhotoViewer.jsx";
import { useNavigation } from "../store/StoreProvider.jsx";

const sectionId = (code) => `casos-${code}`;

// Real cases page (from the start page): the visitor picks one or more parts of the face (or all of them) and the
// cases show below, one section per part in face order, with the before photo above the after one.
export function CasesScreen() {
  const { goTo } = useNavigation();
  const available = areasWithCases();
  const [chosen, setChosen] = useState([]);
  const [viewer, setViewer] = useState(null);
  const closeViewer = useCallback(() => setViewer(null), []);

  const allChosen = available.length > 0 && available.every((code) => chosen.includes(code));
  const toggle = (code) =>
    setChosen((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  const toggleAll = () => setChosen(allChosen ? [] : available);
  const groups = groupByArea(chosen);

  const bar = (
    <>
      <button class="btn secondary" id="back" onClick={() => goTo("start")}>
        {t("cases.back")}
      </button>
      <button class="btn primary" id="go-agenda" data-track="agenda_open" onClick={() => goTo("agenda")}>
        {t("cases.agenda")}
      </button>
    </>
  );

  return (
    <>
      <Layout bar={bar}>
        <header class="topbar">
          <Brand />
        </header>
        <div class="block snug">
          <h1>{t("cases.title")}</h1>
          <p class="sub">{t(available.length ? "cases.explanation" : "cases.none")}</p>
        </div>
        {available.length > 0 && (
          <>
            <div class="case-chips" role="group" aria-label={t("cases.areas")}>
              <button class="case-chip" id="cases-all" aria-pressed={allChosen} onClick={toggleAll}>
                {t("cases.all")}
              </button>
              {available.map((code) => (
                <button key={code} class="case-chip" aria-pressed={chosen.includes(code)} onClick={() => toggle(code)}>
                  {AREA_BY_CODE[code].name} <small>{casesOf(code).length}</small>
                </button>
              ))}
            </div>
            <p class="sub note">{t("results.notice")}</p>
          </>
        )}
        {groups.length > 1 && (
          <nav class="case-jump" aria-label={t("cases.jump")}>
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
        {available.length > 0 && groups.length === 0 && <p class="case-empty">{t("cases.pick")}</p>}
        {groups.map(({ code, cases }) => {
          const name = AREA_BY_CODE[code].name;
          return (
            <section key={code} class="case-group" id={sectionId(code)} data-code={code}>
              <div class="case-group-head">
                <h2>{name}</h2>
                <span>{tn("cases.count", cases.length)}</span>
              </div>
              {cases.map((item) => (
                <CaseCard key={item.folder} item={item} onOpen={setViewer} />
              ))}
              <p class="case-group-end">{t("cases.end", { area: name.toLowerCase() })}</p>
            </section>
          );
        })}
      </Layout>
      {viewer && <PhotoViewer {...viewer} onClose={closeViewer} />}
    </>
  );
}
