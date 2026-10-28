import flow from "../data/flow.json";

export const TOTAL_STEPS = flow.totalSteps;

/** Step number shown in the progress bar for a screen. */
export const stepOf = id => flow.screens.find(s => s.id === id)?.step;
