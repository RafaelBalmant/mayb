import { t } from "../content.js";
import { TOTAL_STEPS } from "../domain/flow.js";
import { Brand } from "./Brand.jsx";

/** Brand, progress bar and "Step X of Y · title". */
export function Topbar({ step, title }) {
  return (
    <header class="topbar">
      <Brand />
      <div class="progress" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <span key={i} class={i < step ? "ok" : ""} />
        ))}
      </div>
      <div class="step">{t("general.step", { current: step, total: TOTAL_STEPS, title })}</div>
    </header>
  );
}
