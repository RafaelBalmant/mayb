// The site's two fonts (see theme.css, which is where the CSS reads them from). next/font downloads them at build
// time, serves them from this site and sizes the fallback font to match, so the text does not jump when the real
// font arrives. Only the body font is preloaded: preloading the title font (two files, normal and italic) competed
// with the start page photo, the largest element, and delayed it (Lighthouse LCP).
import { Jost, Playfair_Display } from "next/font/google";

/** Titles and the big name on the start page. */
export const titleFont = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

/** Body text and buttons. */
export const textFont = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });

/** Classes for <html>: they define --font-playfair and --font-jost. */
export const fontVariables = `${titleFont.variable} ${textFont.variable}`;
