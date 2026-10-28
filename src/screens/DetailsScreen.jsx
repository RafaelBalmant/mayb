import { AREA_BY_CODE, t } from "../content.js";
import { QUESTIONS } from "../domain/questions.js";
import { Layout } from "../components/Layout.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { QUESTION_COMPONENTS } from "../components/questions.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

const isVisible = (q, def) =>
  (!q.onlyFor || q.onlyFor === def.code) &&
  (!q.exceptFor || q.exceptFor !== def.code) &&
  (!q.requires || def[q.requires]);

// Details: one card per marked area; the questions come from data/questions.json.
export function DetailsScreen() {
  const { state, dispatch } = useStore();
  const { goTo } = useNavigation();
  const total = state.areas.length;
  const index = Math.min(state.ui.index, total - 1);
  const area = state.areas[index];
  const def = AREA_BY_CODE[area.code];
  const isLast = index === total - 1;

  const update = (patch) => dispatch({ type: "UPDATE_AREA", code: area.code, patch });
  const setOtherOpen = (open) => dispatch({ type: "SET_OTHER_OPEN", code: area.code, open });
  const advance = () => (isLast ? goTo("review") : goTo("details", index + 1));

  const bar = (
    <>
      <button class="btn secondary" id="back" onClick={() => (index === 0 ? goTo("next") : goTo("details", index - 1))}>
        {t("general.back")}
      </button>
      <button class="btn primary" id="nextArea" onClick={advance}>
        {t(isLast ? "details.finish" : "details.nextArea")}
      </button>
    </>
  );

  return (
    <Layout bar={bar}>
      <Topbar screen="details" />
      <article class="card">
        <div class="head">
          <div class="counter">{t("details.counter", { current: index + 1, total })}</div>
          <h2>{def.name}</h2>
          <p class="sub">{t("details.optional")}</p>
        </div>
        {QUESTIONS.filter((q) => isVisible(q, def)).map((q) => {
          const Question = QUESTION_COMPONENTS[q.type];
          return (
            <Question
              key={q.field}
              question={q}
              area={area}
              P={t("details.questions")}
              update={update}
              otherOpen={state.otherOpen.includes(area.code)}
              setOtherOpen={setOtherOpen}
            />
          );
        })}
        <button type="button" class="skip" id="skip" onClick={advance}>
          {t("details.skip")}
        </button>
      </article>
    </Layout>
  );
}
