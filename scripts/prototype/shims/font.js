// Stands in for next/font/google in the prototype page, which loads the same fonts from Google Fonts instead
// (see build.mjs): no class names, the CSS variables are set in the page's own style.
const font = () => ({ variable: "", className: "", style: {} });
export const Jost = font;
export const Playfair_Display = font;
