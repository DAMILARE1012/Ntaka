/**
 * Reading preferences.
 *
 * The assertions that matter are the ones a normal render test would miss:
 *
 *   1. The attribute list is duplicated — once in preferences.js, once in the pre-paint
 *      script in index.html, which runs before any module loads and so cannot import it.
 *      Duplication is the right call there and a silent liability everywhere else, so the
 *      two lists are compared here.
 *   2. Text scaling only works because every size in tailwind.config.js is in rem. A px
 *      value would make the control do nothing at all, with no error.
 *   3. This is a preferences panel, not a compliance claim. It must not say otherwise.
 */
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '../src/app/store.js';
import {
  PREFERENCES,
  PRESETS,
  DEFAULTS,
  GROUPS,
  STORAGE_KEY,
  sanitise,
  applyPreferences,
  changedCount,
  matchingPreset,
  isDefault,
  fromSystem,
} from '../src/features/personalization/preferences.js';
import {
  preferenceSet,
  presetApplied,
  preferencesReset,
  selectPreferences,
} from '../src/features/personalization/preferencesSlice.js';
import PersonalizationPanel from '../src/features/personalization/PersonalizationPanel.jsx';
import PersonalizationButton from '../src/features/personalization/PersonalizationButton.jsx';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
};

/* ------------------------------------------------------------------- model */

console.log('\n--- the model ---');
ok('every preference has a label and an attribute', Object.values(PREFERENCES).every((p) => p.label && p.attr));
ok('every attribute is unique', new Set(Object.values(PREFERENCES).map((p) => p.attr)).size === Object.keys(PREFERENCES).length);
ok('every preference belongs to a rendered group', Object.values(PREFERENCES).every((p) => GROUPS.some((g) => g.id === p.group)));
ok('choices include their own default', Object.values(PREFERENCES).filter((p) => p.kind === 'choice').every((p) => p.options.some((o) => o.value === p.default)));
ok('toggles default to off', Object.values(PREFERENCES).filter((p) => p.kind === 'toggle').every((p) => p.default === false));
ok('defaults change nothing', isDefault(DEFAULTS) && changedCount(DEFAULTS) === 0);

console.log('\n--- storage is treated as untrusted ---');
ok('junk falls back to defaults', JSON.stringify(sanitise(null)) === JSON.stringify(DEFAULTS));
ok('an unknown key is dropped', sanitise({ evil: true }).evil === undefined);
ok('an out-of-range value is dropped', sanitise({ textScale: '900' }).textScale === DEFAULTS.textScale);
ok('a wrong type is dropped', sanitise({ contrast: 'yes' }).contrast === false);
ok('a valid value survives', sanitise({ textScale: '125' }).textScale === '125');

/* ----------------------------------------------------------------- presets */

console.log('\n--- presets ---');
ok('every preset sets known keys only', PRESETS.every((p) => Object.keys(p.values).every((k) => k in DEFAULTS)));
ok('every preset value is valid', PRESETS.every((p) => JSON.stringify(sanitise({ ...DEFAULTS, ...p.values })) === JSON.stringify({ ...DEFAULTS, ...p.values })));
ok('every preset actually changes something', PRESETS.every((p) => changedCount({ ...DEFAULTS, ...p.values }) > 0));
ok('a preset is recognised once applied', matchingPreset({ ...DEFAULTS, ...PRESETS[0].values })?.id === PRESETS[0].id);
ok('defaults match no preset', matchingPreset(DEFAULTS) === null);

const app = makeStore();
app.dispatch(presetApplied('low-vision'));
ok('applying a preset sets its values', selectPreferences(app.getState()).textScale === '150');
app.dispatch(presetApplied('easier-reading'));
ok(
  'a second preset replaces the first rather than layering onto it',
  selectPreferences(app.getState()).textScale === '110' &&
    selectPreferences(app.getState()).bigCursor === false,
  'applying two presets can never build a combination nobody chose',
);
app.dispatch(preferenceSet({ key: 'contrast', value: true }));
ok('an individual switch still works after a preset', selectPreferences(app.getState()).contrast === true);
ok('and it deselects the preset', matchingPreset(selectPreferences(app.getState())) === null);
app.dispatch(preferencesReset());
ok('reset returns to defaults', isDefault(selectPreferences(app.getState())));

app.dispatch(preferenceSet({ key: 'nonsense', value: 'x' }));
ok('an unknown key cannot be set', selectPreferences(app.getState()).nonsense === undefined);

/* -------------------------------------------------------------------- DOM */

console.log('\n--- applying to the document ---');
const attrs = new Map();
const fakeRoot = {
  setAttribute: (k, v) => attrs.set(k, v),
  removeAttribute: (k) => attrs.delete(k),
};

applyPreferences(DEFAULTS, fakeRoot);
ok('defaults write no attributes at all', attrs.size === 0, 'a default page carries no preference markup');

applyPreferences({ ...DEFAULTS, textScale: '125', contrast: true }, fakeRoot);
ok('a choice writes its value', attrs.get('data-pref-text') === '125');
ok('a toggle writes "on"', attrs.get('data-pref-contrast') === 'on');
ok('untouched preferences stay absent', !attrs.has('data-pref-cursor'));

applyPreferences(DEFAULTS, fakeRoot);
ok('returning to defaults removes them again', attrs.size === 0);

/* ------------------------------------------- the duplicated pre-paint list */

console.log('\n--- the pre-paint script has not drifted ---');
const html = readFileSync('index.html', 'utf8');
const missing = Object.entries(PREFERENCES).filter(([key, spec]) => !html.includes(spec.attr) || !html.includes(key));
ok(
  'index.html knows every preference',
  missing.length === 0,
  missing.length ? missing.map(([k]) => k).join(', ') : `${Object.keys(PREFERENCES).length} preferences`,
);
ok('it reads the same storage key', html.includes(STORAGE_KEY));
ok('it runs before the app bundle', html.indexOf(STORAGE_KEY) < html.indexOf('/src/main.jsx'));
ok('it seeds from the system, like the module does', html.includes('prefers-reduced-motion'));
ok('the module seeds the same way', fromSystem(() => ({ matches: true })).reduceMotion === true);
ok('and survives no matchMedia', fromSystem(null).reduceMotion === false);

/* ------------------------------------------------------------------- CSS */

console.log('\n--- the CSS the attributes drive ---');
const css = readFileSync('src/index.css', 'utf8');
const unstyled = Object.entries(PREFERENCES).filter(([, spec]) => !css.includes(`[${spec.attr}`));
ok(
  'every preference has a rule',
  unstyled.length === 0,
  unstyled.length ? unstyled.map(([k]) => k).join(', ') : 'nothing is a dead switch',
);

const tw = readFileSync('tailwind.config.js', 'utf8');
const fontSizeBlock = tw.slice(tw.indexOf('fontSize:'), tw.indexOf('extend:'));
ok(
  'text scaling works because every size is in rem',
  !/'\d+px'|\[\s*'\d+px'/.test(fontSizeBlock),
  'a px scale would make the control silently do nothing',
);
ok('grayscale is applied at the root, not a wrapper', css.includes(":root[data-pref-grayscale] { filter: grayscale(1); }"));
ok('high contrast overrides tokens rather than filtering', !css.includes('data-pref-contrast] { filter'));
ok('reduce motion stops the marquees', css.includes('[data-pref-motion] .marquee-track'));
ok('the ruler cannot swallow clicks', css.includes('pointer-events: none'));
ok('tone emphasis targets language text only', css.includes('[data-pref-tones] .lang-target'));

const marked = ['src/features/learning/components/ConversationPlayer.jsx', 'src/features/learning/components/LessonStage.jsx'];
ok(
  'target-language text is actually marked',
  marked.every((f) => readFileSync(f, 'utf8').includes('lang-target')),
  'otherwise tone emphasis is a switch that does nothing',
);

/* --------------------------------------------------------------- rendering */

console.log('\n--- rendering ---');
const render = (node) =>
  renderToString(
    <Provider store={makeStore()}>
      <StaticRouter location="/">{node}</StaticRouter>
    </Provider>,
  ).replaceAll('<!-- -->', '');

const panel = render(<PersonalizationPanel onClose={() => {}} />);
ok('the panel is a labelled dialog', panel.includes('role="dialog"') && panel.includes('aria-label="Reading preferences"'));
ok(
  'presets come first, before the individual switches',
  panel.indexOf('Start with') < panel.indexOf('Line spacing'),
);
ok('every preset is offered', PRESETS.every((p) => panel.includes(p.label)));
ok('every preference is offered', Object.values(PREFERENCES).every((p) => panel.includes(p.label)));
ok('choices are radio groups', panel.includes('role="radiogroup"') && panel.includes('role="radio"'));
ok('toggles are switches', panel.includes('role="switch"') && panel.includes('aria-checked'));
ok('there is a way out', panel.includes('Reset all'));

const button = render(<PersonalizationButton />);
ok('the launcher is a real button', button.includes('<button') && button.includes('aria-expanded'));
ok('it is labelled for screen readers', button.includes('aria-label="Reading preferences"'));

// The universal access symbol specifically. People who need this control scan for that
// shape rather than reading the page, so a prettier bespoke icon would be a worse one.
const iconSrc = readFileSync('src/components/ui/Icon.jsx', 'utf8');
ok('the accessibility symbol exists as an icon', iconSrc.includes('accessibility:'));
ok('it is drawn filled, not stroked', /FILLED = new Set\(\[[^\]]*'accessibility'/.test(iconSrc));
ok(
  'the launcher uses it',
  readFileSync('src/features/personalization/PersonalizationButton.jsx', 'utf8').includes("'accessibility'"),
);

console.log('\n--- it claims nothing it cannot back ---');
const claims = /WCAG.compliant|fully accessible|ADA.compliant|accessibility compliant|makes (this|our) site accessible/i;
ok('no compliance claim in the panel', !claims.test(panel));
ok('none in the model either', !claims.test(readFileSync('src/features/personalization/preferences.js', 'utf8')));
ok(
  'and it says the reader’s own tools stay in charge',
  panel.includes('screen reader') && panel.includes('stay in charge'),
);
ok(
  'read-aloud is deliberately absent',
  !panel.includes('Read page') && !panel.includes('speechSynthesis'),
  'no Yorùbá or Igbo voices exist — an English voice would flatten the tones',
);

console.log(failed ? `\nPERSONALIZATION CHECKS FAILED (${failed})` : '\nPERSONALIZATION CHECKS OK');
process.exit(failed ? 1 : 0);
