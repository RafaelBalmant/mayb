import { useEffect, useRef } from "preact/hooks";
import { AREA_BY_CODE, labels, t } from "../content.js";
import { INTENSITY_SCALE } from "../config.js";

// One component per question type in data/questions.json. They all receive:
//   question  the entry from questions.json
//   area      the area being answered
//   P         texts.details.questions (the question titles)
//   update    update(patch) merges fields into the area
//   otherOpen / setOtherOpen  whether the free-text "Other" field is open (concerns only)

const Chip = ({ pressed, onClick, children }) => (
  <button type="button" class="chip" aria-pressed={pressed} onClick={onClick}>
    {children}
  </button>
);

/** Free-text question. */
export function TextareaQuestion({ question: q, area, P, update }) {
  return (
    <div class="question">
      <label for={q.field}>{P[q.labelKey ?? q.field]}</label>
      <textarea
        id={q.field}
        placeholder={t(q.placeholder)}
        value={area[q.field]}
        onInput={e => update({ [q.field]: e.currentTarget.value })}
      />
    </div>
  );
}

/** Multiple choice among the area's own options, plus a free-text "Other". */
export function ConcernsQuestion({ question: q, area, P, update, otherOpen, setOtherOpen }) {
  const options = AREA_BY_CODE[area.code].options;
  const withOther = area.concernsOther !== "" || otherOpen;
  const inputRef = useRef();
  const focusOnOpenRef = useRef(false);

  useEffect(() => {
    if (focusOnOpenRef.current && withOther) inputRef.current?.focus({ preventScroll: true });
    focusOnOpenRef.current = false;
  }, [withOther]);

  const toggleOption = id => {
    const chosen = area.concerns.includes(id) ? area.concerns.filter(x => x !== id) : [...area.concerns, id];
    update({ concerns: options.map(o => o.id).filter(x => chosen.includes(x)) }); // keep content order
  };
  const toggleOther = () => {
    if (withOther) {
      update({ concernsOther: "" });
      setOtherOpen(false);
    } else {
      focusOnOpenRef.current = true;
      setOtherOpen(true);
    }
  };

  return (
    <fieldset class="question">
      <legend>
        {P[q.field]} <span class="hint">{t("details.multipleAllowed")}</span>
      </legend>
      <div class="chips">
        {options.map(o => (
          <Chip key={o.id} pressed={area.concerns.includes(o.id)} onClick={() => toggleOption(o.id)}>
            {o.label}
          </Chip>
        ))}
        <button type="button" class="chip" id="other-btn" aria-pressed={withOther} onClick={toggleOther}>
          {t("details.other")}
        </button>
      </div>
      {withOther && (
        <input
          type="text"
          id="other-txt"
          ref={inputRef}
          placeholder={t("details.otherPlaceholder")}
          value={area.concernsOther}
          onInput={e => update({ concernsOther: e.currentTarget.value })}
        />
      )}
    </fieldset>
  );
}

/** Single choice from a list of labels; tapping the chosen one again clears it. */
export function SingleQuestion({ question: q, area, P, update }) {
  const d = q.detail;
  return (
    <fieldset class="question">
      <legend>{P[q.field]}</legend>
      <div class="chips">
        {Object.entries(labels[q.labels]).map(([value, label]) => (
          <Chip key={value} pressed={area[q.field] === value} onClick={() => update({ [q.field]: area[q.field] === value ? null : value })}>
            {label}
          </Chip>
        ))}
      </div>
      {d && area[q.field] === d.showWhen && (
        <input
          type="text"
          id={`${d.field}-txt`}
          placeholder={t(d.placeholder)}
          value={area[d.field]}
          onInput={e => update({ [d.field]: e.currentTarget.value })}
        />
      )}
    </fieldset>
  );
}

/** 1..5 scale. */
export function ScaleQuestion({ question: q, area, P, update }) {
  return (
    <fieldset class="question">
      <legend>{P[q.field]}</legend>
      <div class="scale">
        {INTENSITY_SCALE.map(n => (
          <Chip key={n} pressed={area[q.field] === n} onClick={() => update({ [q.field]: area[q.field] === n ? null : n })}>
            {n}
          </Chip>
        ))}
      </div>
      <div class="scale-legend">
        <span>{t("details.intensityLow")}</span>
        <span>{t("details.intensityHigh")}</span>
      </div>
    </fieldset>
  );
}

export const QUESTION_COMPONENTS = {
  textarea: TextareaQuestion,
  areaOptions: ConcernsQuestion,
  single: SingleQuestion,
  scale: ScaleQuestion,
};
