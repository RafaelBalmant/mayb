import { stepOf } from "../domain/flow.js";
import { Brand } from "./Brand.jsx";
import { Progress } from "./Progress.jsx";

/** Top of a screen that belongs to a flow: the brand and the progress of that screen's step (data/flow.json). */
export function Topbar({ screen }) {
  const { flow, step } = stepOf(screen);
  return (
    <header class="topbar">
      <Brand />
      <Progress flow={flow} step={step} />
    </header>
  );
}
