import { AREA_BY_CODE, t } from "../content.js";
import { AudioPlayer } from "./AudioPlayer.jsx";

/** "Boca e lábios + Queixo": the names of a case's areas. */
export const areasLabel = (codes) => codes.map((code) => AREA_BY_CODE[code].name).join(t("cases.areasJoin"));

/** A before or after photo; tapping it opens the photo full screen. */
function CasePhoto({ src, moment, title, onOpen }) {
  const vars = { moment, title };
  return (
    <figure>
      <span class="moment">{moment}</span>
      <button
        class="photo"
        aria-label={t("cases.openPhoto", vars)}
        onClick={(e) => onOpen({ src, label: moment, caption: title, origin: e.currentTarget })}
      >
        <img src={src} alt={t("cases.photo", vars)} loading="lazy" />
      </button>
    </figure>
  );
}

/**
 * One real case: title, procedures, the areas when there is more than one, the doctor's audio (optional) and the
 * before/after pairs, the before photo above the after one. Tapping a photo calls onOpen to show it full screen.
 */
export function CaseCard({ item, onOpen }) {
  const afterLabel = item.after ? t("cases.afterWhen", { when: item.after }) : t("cases.after");

  return (
    <article class="case" data-folder={item.folder}>
      <header class="case-head">
        <h3>{item.title}</h3>
        {item.procedures.length > 0 && <p class="case-procedures">{item.procedures.join(" · ")}</p>}
        {item.areas.length > 1 && <span class="case-areas">{areasLabel(item.areas)}</span>}
      </header>
      {item.audio && <AudioPlayer src={item.audio} text={item.audioText} />}
      {item.pairs.map((pair) => (
        <div class="case-pair" key={pair.before}>
          <CasePhoto src={pair.before} moment={t("cases.before")} title={item.title} onOpen={onOpen} />
          <CasePhoto src={pair.after} moment={afterLabel} title={item.title} onOpen={onOpen} />
        </div>
      ))}
      {item.description && <p class="case-description">{item.description}</p>}
    </article>
  );
}
