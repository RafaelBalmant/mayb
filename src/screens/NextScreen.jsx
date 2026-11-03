import { AREA_BY_CODE, t, tn } from "../content.js";
import { Layout } from "../components/Layout.jsx";
import { Paragraphs } from "../components/Paragraphs.jsx";
import { Topbar } from "../components/Topbar.jsx";
import { useNavigation } from "../navigation/useNavigation.js";
import { useStore } from "../store/StoreProvider.jsx";

// Between the map and the details: explains the next step and lets the visitor choose.
export function NextScreen() {
  const { state } = useStore();
  const { goTo } = useNavigation();

  const bar = (
    <button className="btn secondary" id="back" onClick={() => goTo("results")}>
      {t("general.back")}
    </button>
  );

  return (
    <Layout bar={bar}>
      <Topbar screen="next" />
      <h1 className="big-question">{t("next.title")}</h1>
      <div className="block">
        <h3>{tn("next.marked", state.areas.length)}</h3>
        <ul className="summary-marked">
          {state.areas.map((a) => (
            <li key={a.code}>{AREA_BY_CODE[a.code].name}</li>
          ))}
        </ul>
      </div>
      <Paragraphs items={t("next.explanation")} className="explain" />
      <div className="routes">
        <button className="route primary" id="more-info" onClick={() => goTo("details")}>
          <strong>{t("next.moreInfo")}</strong>
          <span>{t("next.moreInfoDetail")}</span>
        </button>
        <button className="route" id="talk" onClick={() => goTo("review")}>
          <strong>{t("next.talk")}</strong>
          <span>{t("next.talkDetail")}</span>
        </button>
      </div>
    </Layout>
  );
}
