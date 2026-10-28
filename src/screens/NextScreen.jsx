import { AREA_BY_CODE, t, tn } from "../content.js";
import { Brand } from "../components/Brand.jsx";
import { Layout } from "../components/Layout.jsx";
import { Paragraphs } from "../components/Paragraphs.jsx";
import { useNavigation, useStore } from "../store/StoreProvider.jsx";

// Between the map and the details: explains the next step and lets the visitor choose.
export function NextScreen() {
  const { state } = useStore();
  const { goTo } = useNavigation();

  const bar = (
    <button class="btn secondary" id="back" onClick={() => goTo("map")}>
      {t("next.back")}
    </button>
  );

  return (
    <Layout bar={bar}>
      <Brand />
      <h1 class="big-question">{t("next.title")}</h1>
      <div class="block">
        <h3>{tn("next.marked", state.areas.length)}</h3>
        <ul class="summary-marked">
          {state.areas.map(a => (
            <li key={a.code}>{AREA_BY_CODE[a.code].name}</li>
          ))}
        </ul>
      </div>
      <Paragraphs items={t("next.explanation")} className="explain" />
      <div class="routes">
        <button class="route primary" id="more-info" onClick={() => goTo("details")}>
          <strong>{t("next.moreInfo")}</strong>
          <span>{t("next.moreInfoDetail")}</span>
        </button>
        <button class="route" id="talk" onClick={() => goTo("review")}>
          <strong>{t("next.talk")}</strong>
          <span>{t("next.talkDetail")}</span>
        </button>
      </div>
    </Layout>
  );
}
