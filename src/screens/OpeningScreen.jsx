import { t } from "../content.js";
import { Face } from "../components/Face.jsx";
import { Layout } from "../components/Layout.jsx";
import { Paragraphs } from "../components/Paragraphs.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

// Opening of the map flow: the question, what comes next and the choice of face.
export function OpeningScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const { face } = state;

  const bar = (
    <>
      <button class="btn secondary" id="back" onClick={() => goTo("start")}>
        {t("general.back")}
      </button>
      <button class="btn primary" id="start" disabled={!face} onClick={() => goTo("map")}>
        {t(face ? "opening.start" : "opening.startWithoutFace")}
      </button>
    </>
  );

  return (
    <Layout bar={bar}>
      <Topbar screen="opening" />
      <h1 class="big-question">{t("opening.title")}</h1>
      <Paragraphs items={t("opening.explanation")} className="explain" />
      <section class="block">
        <h3>{t("opening.chooseFace")}</h3>
        <div class="choice">
          {["female", "male"].map((option) => (
            <button
              key={option}
              aria-pressed={face === option}
              onClick={() => dispatch({ type: "SET_FACE", face: option })}
            >
              <Face face={option} view="front" />
              {t(`opening.${option}`)}
            </button>
          ))}
        </div>
      </section>
    </Layout>
  );
}
