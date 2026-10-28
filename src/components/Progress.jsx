import { t } from "../content.js";

/** Progress bar of a flow ("face" or "agenda") and its "Step X of Y · name" line. Steps come from texts.steps. */
export function Progress({ flow, step }) {
  const names = t(`steps.${flow}`);
  return (
    <>
      <div class="progress" aria-hidden="true">
        {names.map((name, i) => (
          <span key={name} class={i < step ? "ok" : ""} />
        ))}
      </div>
      <div class="step">{t("general.step", { current: step, total: names.length, title: names[step - 1] })}</div>
    </>
  );
}
