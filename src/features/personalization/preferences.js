/**
 * Reading and display preferences.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHAT THIS IS, AND WHAT IT IS NOT
 * ─────────────────────────────────────────────────────────────────────────────
 *  It is a preferences panel: the reader tells us how they want to read, and we do it.
 *
 *  It is NOT an accessibility overlay, and nothing here claims the site is compliant
 *  because of it. Those claims are the reason overlays are contested — the Overlay Fact
 *  Sheet is signed by hundreds of practitioners, and the FTC fined a vendor $1m in 2025
 *  for exactly that promise. A widget cannot fix semantics, focus order or alt text, and
 *  a site that leans on one to skip that work ends up less usable, not more.
 *
 *  So this layer is deliberately additive. Everything under it — semantic tokens, real
 *  headings, keyboard-navigable menus, native <details>, aria-current, alt text — is
 *  what actually does the work, and none of it depends on anyone opening this panel.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THREE THINGS DELIBERATELY LEFT OUT
 * ─────────────────────────────────────────────────────────────────────────────
 *  Read aloud.  The Web Speech API has essentially no Yorùbá, Igbo or Hausa voices. A
 *               button that reads Yorùbá in an English voice would flatten exactly the
 *               tone marks this platform exists to teach. Worse than nothing here.
 *  Dictation.   Chrome's implementation ships audio to Google's servers, which would make
 *               them a sub-processor we have not disclosed. See src/content/legal.js.
 *  Invert.      Needs a counter-filter on every image to stop photographs going negative,
 *               and dark mode already serves the need honestly.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHY THESE ARE DEVICE SETTINGS, NOT PROFILE SETTINGS
 * ─────────────────────────────────────────────────────────────────────────────
 *  Stored per device, not per account, and available signed out. Someone who needs a
 *  larger cursor needs it on the login page, before there is an account to attach it to.
 *  That also keeps them out of the per-user storage the placement results live in: how
 *  someone reads is not a fact about their learning we should be filing away.
 */

export const STORAGE_KEY = 'ntaka.reading.v1';

/**
 * Every preference, as data.
 *
 * `attr` is the attribute written onto <html>; the CSS in index.css keys off it. Keeping
 * the mapping here means adding a preference is one entry plus one CSS rule, and the
 * pre-paint script in index.html needs no changes at all.
 */
export const PREFERENCES = {
  textScale: {
    label: 'Text size',
    attr: 'data-pref-text',
    kind: 'choice',
    default: '100',
    options: [
      { value: '100', label: 'Aa', title: 'Default' },
      { value: '110', label: '110%' },
      { value: '125', label: '125%' },
      { value: '150', label: '150%' },
    ],
    group: 'reading',
  },
  lineHeight: {
    label: 'Line spacing',
    attr: 'data-pref-leading',
    kind: 'choice',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'relaxed', label: 'Relaxed' },
      { value: 'loose', label: 'Loose' },
    ],
    group: 'reading',
    /** WCAG 1.4.12 asks that content survive line-height 1.5x; "loose" goes past it. */
    note: 'Meets WCAG text spacing at Relaxed and above',
  },
  letterSpacing: {
    label: 'Letter spacing',
    attr: 'data-pref-tracking',
    kind: 'choice',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'wide', label: 'Wide' },
      { value: 'wider', label: 'Widest' },
    ],
    group: 'reading',
  },
  font: {
    label: 'Typeface',
    attr: 'data-pref-font',
    kind: 'choice',
    default: 'default',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'readable', label: 'Plain sans' },
      { value: 'mono', label: 'Even width' },
    ],
    group: 'reading',
    /*
     * Deliberately not labelled "dyslexia font". The evidence that OpenDyslexic improves
     * reading speed is weak — Rello & Baeza-Yates (2013) and Wery & Diliberto (2017) both
     * found no reliable benefit over a plain sans-serif — though people do report
     * preferring it. Offering a plain, high-legibility stack is the honest version of the
     * same idea, and it needs no extra font download.
     */
    note: 'A plain, even-width typeface some readers find easier',
  },

  contrast: {
    label: 'Higher contrast',
    attr: 'data-pref-contrast',
    kind: 'toggle',
    default: false,
    group: 'display',
    note: 'Deepens text and borders. Not a colour filter, so photographs are untouched.',
  },
  grayscale: {
    label: 'Remove colour',
    attr: 'data-pref-grayscale',
    kind: 'toggle',
    default: false,
    group: 'display',
  },
  reduceMotion: {
    label: 'Reduce motion',
    attr: 'data-pref-motion',
    kind: 'toggle',
    default: false,
    group: 'display',
    note: 'Stops the sliders and transitions. On by default if your system asks for it.',
  },
  highlightLinks: {
    label: 'Underline every link',
    attr: 'data-pref-links',
    kind: 'toggle',
    default: false,
    group: 'display',
  },

  bigCursor: {
    label: 'Large cursor',
    attr: 'data-pref-cursor',
    kind: 'toggle',
    default: false,
    group: 'focus',
  },
  readingRuler: {
    label: 'Reading ruler',
    attr: 'data-pref-ruler',
    kind: 'toggle',
    default: false,
    group: 'focus',
    note: 'Dims the page except a band that follows your pointer.',
  },

  /*
   * The one nobody else has, and the reason this panel is not a generic widget.
   *
   * Yorùbá and Igbo tone marks are meaning-bearing and physically tiny — ọ̀ and ọ́ are
   * different words, and at 13px on a laptop the difference is a few pixels. A learner
   * who cannot see the mark cannot learn the tone. This enlarges and spaces target-language
   * text only, leaving the interface at whatever size they already chose.
   */
  toneMarks: {
    label: 'Emphasise tone marks',
    attr: 'data-pref-tones',
    kind: 'toggle',
    default: false,
    group: 'learning',
    note: 'Enlarges Yorùbá, Igbo and other target-language text so diacritics are legible.',
  },
};

export const GROUPS = [
  { id: 'reading', label: 'Reading', icon: 'book' },
  { id: 'display', label: 'Display', icon: 'sparkles' },
  { id: 'focus', label: 'Focus', icon: 'target' },
  { id: 'learning', label: 'Learning', icon: 'globe' },
];

export const DEFAULTS = Object.fromEntries(
  Object.entries(PREFERENCES).map(([key, spec]) => [key, spec.default]),
);

/**
 * Presets — the part the original design does not have.
 *
 * A panel of twelve independent switches asks the reader to know which combination helps
 * them, which is the wrong way round: someone with low vision should not have to work out
 * that they want 150% text AND higher contrast AND a large cursor. A preset applies the
 * combination, and every switch stays adjustable afterwards.
 */
export const PRESETS = [
  {
    id: 'low-vision',
    label: 'Low vision',
    description: 'Large text, high contrast, big cursor.',
    icon: 'search',
    values: { textScale: '150', contrast: true, bigCursor: true, highlightLinks: true },
  },
  {
    id: 'easier-reading',
    label: 'Easier reading',
    description: 'Roomier lines and letters, plain typeface.',
    icon: 'book',
    values: { lineHeight: 'loose', letterSpacing: 'wide', font: 'readable', textScale: '110' },
  },
  {
    id: 'focus',
    label: 'Fewer distractions',
    description: 'No motion, no colour, a ruler to keep your place.',
    icon: 'target',
    values: { reduceMotion: true, grayscale: true, readingRuler: true },
  },
  {
    id: 'language-detail',
    label: 'Tone and detail',
    description: 'Bigger target-language text so diacritics are clear.',
    icon: 'globe',
    values: { toneMarks: true, letterSpacing: 'wide', textScale: '110' },
  },
];

/* --------------------------------------------------------------- validation */

/** Keep only known keys with known values. Storage is user-editable and may be stale. */
export function sanitise(raw) {
  const out = { ...DEFAULTS };
  if (!raw || typeof raw !== 'object') return out;

  for (const [key, spec] of Object.entries(PREFERENCES)) {
    const value = raw[key];
    if (spec.kind === 'toggle') {
      if (typeof value === 'boolean') out[key] = value;
    } else if (spec.options.some((option) => option.value === value)) {
      out[key] = value;
    }
  }
  return out;
}

export const isDefault = (prefs) =>
  Object.entries(DEFAULTS).every(([key, value]) => prefs[key] === value);

export const changedCount = (prefs) =>
  Object.entries(DEFAULTS).filter(([key, value]) => prefs[key] !== value).length;

/**
 * Which preset, if any, the current settings ARE.
 *
 * Exact equality against defaults-plus-preset, not a subset test. A subset test would keep
 * "Easier reading" highlighted after the reader also turned on high contrast, which tells
 * them they are on a preset they have already moved past.
 */
export const matchingPreset = (prefs) =>
  PRESETS.find((preset) => {
    const target = { ...DEFAULTS, ...preset.values };
    return Object.keys(DEFAULTS).every((key) => prefs[key] === target[key]);
  }) ?? null;

/* ------------------------------------------------------- applying to the DOM */

/**
 * Write preferences onto the root element.
 *
 * Attributes rather than classes, because an attribute carries its value: one
 * `data-pref-text="125"` beats three mutually exclusive classes that can all be on at
 * once if a toggle goes wrong.
 *
 * This is the ONLY function that touches the DOM, and index.html runs the same logic
 * before first paint so there is no flash of unstyled preference.
 */
export function applyPreferences(prefs, root = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!root) return;
  for (const [key, spec] of Object.entries(PREFERENCES)) {
    const value = prefs[key];
    const isOff = spec.kind === 'toggle' ? !value : value === spec.default;
    if (isOff) root.removeAttribute(spec.attr);
    else root.setAttribute(spec.attr, spec.kind === 'toggle' ? 'on' : String(value));
  }
}

/**
 * Seed defaults from what the operating system already says.
 *
 * Someone who has turned on "reduce motion" system-wide has already told us; making them
 * say it again is the kind of small disrespect that adds up.
 */
export function fromSystem(match = typeof window !== 'undefined' ? window.matchMedia : null) {
  const seeded = { ...DEFAULTS };
  if (!match) return seeded;
  try {
    if (match('(prefers-reduced-motion: reduce)').matches) seeded.reduceMotion = true;
    if (match('(prefers-contrast: more)').matches) seeded.contrast = true;
  } catch {
    /* matchMedia unavailable — plain defaults are correct */
  }
  return seeded;
}

export function loadPreferences() {
  if (typeof localStorage === 'undefined') return fromSystem();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fromSystem();
    return sanitise(JSON.parse(raw));
  } catch {
    return fromSystem();
  }
}
