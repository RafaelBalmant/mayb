// App constants that are not site text (the text lives in data/content.json).

/** sessionStorage key; bump the suffix when the saved shape stops being compatible. */
export const STORAGE_KEY = "site-mayara:v3";

/** Old key (code with Portuguese names); read once and converted. */
export const LEGACY_STORAGE_KEY = "site-mayara:v2";

/** Values of the discomfort scale. */
export const INTENSITY_SCALE = [1, 2, 3, 4, 5];

/** Maximum length of the name in the WhatsApp message. */
export const NAME_MAX_LENGTH = 60;

/**
 * Shrinking of free-text fields when the message exceeds the limit:
 * starts at `start` characters and shrinks by `step` until `min`.
 */
export const FREE_TEXT_SHRINK = { start: 200, step: 20, min: 20 };

/** Start of the WhatsApp chat link. */
export const WHATSAPP_BASE_URL = "https://wa.me/";

/** How long the map notice stays visible (ms). */
export const NOTICE_DURATION_MS = 1400;

/** Wait before going to the "sent" screen, so the WhatsApp link opens first (ms). */
export const SEND_REDIRECT_DELAY_MS = 300;

/**
 * Whether the face-map flow and the real cases page are open to everyone. While false, the start page only offers
 * the agenda; both can still be tried with ?mapa=1 in the address (kept until the tab is closed; ?mapa=0 turns it off).
 */
export const MAP_ENABLED = false;

/** sessionStorage key that remembers ?mapa=1 for this tab. */
export const MAP_PREVIEW_KEY = "site-mayara:mapa";

/** Whether the map offers the profile view (the drawings stay in src/faces/ either way). */
export const SHOW_PROFILE_VIEW = false;

/** How many months the agenda selector shows, counting from the current one. */
export const AGENDA_MONTHS_SHOWN = 4;

/** A horizontal drag on the calendar changes the month: at least this many px, and clearly more sideways than vertical. */
export const SWIPE_MIN_DISTANCE = 50;
export const SWIPE_DIRECTION_RATIO = 1.5;

/** How many "coming soon" frames a part without photos shows (one before/after pair). */
export const PLACEHOLDER_PHOTOS = 2;

/** Google reviews on the start page: each visit shows one of up to REVIEWS_MAX_GROUPS groups of this many reviews. */
export const REVIEWS_GROUP_SIZE = 5;
export const REVIEWS_MAX_GROUPS = 3;

/** Storage key that remembers which group of reviews the last visit showed. */
export const REVIEWS_GROUP_KEY = "site-mayara:reviews-group";

/** Time each review stays on screen before the carousel moves on by itself (ms). */
export const REVIEWS_AUTOPLAY_MS = 10000;

/** After the visitor touches the carousel, it waits this long without changes before moving on by itself again (ms). */
export const REVIEWS_RESUME_AFTER_MS = 30000;

/**
 * Whether the cases page (and the results step) also shows the example cases of data/case-examples.json, so the
 * design can be seen before there are real ones. They carry an "Exemplo" tag and, like the page, only show with
 * ?mapa=1. Turn off (or delete that file and src/case-examples/) once real cases are in.
 */
export const SHOW_CASE_EXAMPLES = true;

/**
 * Analytics IDs, given at build time (VITE_GA_MEASUREMENT_ID; see README). They are not secrets (they show in the
 * page), but they stay out of the code so a local or test build does not count as a real visit.
 * Empty: no cookie notice and nothing is loaded. (`?.`: plain Node scripts such as fetch-reviews import this file too.)
 */
export const ANALYTICS_IDS = {
  googleAnalytics: import.meta.env?.VITE_GA_MEASUREMENT_ID ?? "",
};

/** localStorage key that remembers the visitor's answer to the cookie notice. */
export const CONSENT_KEY = "site-mayara:cookies";
