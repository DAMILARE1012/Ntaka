/**
 * Navbar active state.
 *
 * The bug this locks down: `/#partners` has the pathname `/`, so NavLink lit "Partners" the
 * instant the homepage loaded — in the hero, nowhere near the partner band — and then never
 * changed however far the reader scrolled. Active but static, which tells the reader
 * something false about where they are.
 *
 * Two halves are tested. Route-level state is asserted by rendering the navbar at each
 * route. The scroll-spy half is asserted through `pickActive`, which is the whole decision
 * the observer makes, extracted so it can be checked without a browser.
 */
import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '../src/app/store.js';
import Navbar, { NAV_LINKS } from '../src/components/layout/Navbar.jsx';
import { LEARN_MODES } from '../src/components/layout/LearnMenu.jsx';
import { pickActive, observerOptions } from '../src/components/layout/useActiveSection.js';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

const render = (route) =>
  renderToString(
    <Provider store={makeStore()}>
      <StaticRouter location={route}>
        <Navbar />
      </StaticRouter>
    </Provider>,
  );

/** Active state of each desktop nav link, by href. Mobile duplicates are skipped. */
function activeMap(route) {
  const html = render(route);
  const map = {};
  for (const m of html.matchAll(/<a\b([^>]*)href="([^"]+)"([^>]*)>/g)) {
    const attrs = m[1] + m[3];
    if (attrs.includes('rounded-lg px-3 py-2.5')) continue;
    if (!attrs.includes('rounded-md px-3 py-1.5')) continue;
    map[m[2]] = /\btext-brand\b/.test(attrs);
  }
  const learn = html.match(/<button[^>]*class="([^"]*)"[^>]*>\s*Learn/);
  map.Learn = Boolean(learn && /\btext-brand\b/.test(learn[1]));
  return map;
}

/* --------------------------------------------------- route-level active state */

console.log('\n--- each page lights its own nav item ---');
const languages = activeMap('/languages');
ok('Languages is active on /languages', languages['/languages'] === true);
ok('and nothing else is', !languages['/faq'] && !languages['/#partners'] && !languages.Learn);

const faq = activeMap('/faq');
ok('FAQ is active on /faq', faq['/faq'] === true);
ok('and nothing else is', !faq['/languages'] && !faq['/#partners'] && !faq.Learn);

console.log('\n--- the Learn menu covers all three modes ---');
for (const mode of LEARN_MODES) {
  const map = activeMap(mode.to);
  ok(`Learn is active on ${mode.to}`, map.Learn === true);
  ok(`  and no flat link is`, !map['/languages'] && !map['/faq'] && !map['/#partners']);
}

console.log('\n--- a nested route keeps its parent lit ---');
ok('Learn stays active on a teacher profile', activeMap('/teachers/t-1').Learn === true);
ok('Languages stays active on a language page', activeMap('/languages/yoruba')['/languages'] === true);

/* --------------------------------------------------------- the section link */

console.log('\n--- the section link is no longer permanently lit ---');
const home = activeMap('/');
ok(
  'Partners is NOT active at the top of the homepage',
  home['/#partners'] === false,
  'it used to light up in the hero and never change',
);
ok('nothing at all is active on the homepage', Object.values(home).every((v) => v === false));

console.log('\n--- but it does light on its own sub-page ---');
const partners = activeMap('/partners');
ok('Partners is active on /partners', partners['/#partners'] === true);
ok('and nothing else is', !partners['/languages'] && !partners['/faq'] && !partners.Learn);

const link = NAV_LINKS.find((l) => l.section);
ok('the section link declares its section', link?.section === 'partners');
ok('and the page it lives on', link?.on === '/');
ok('and the sub-page that also counts', link?.alsoActiveOn?.includes('/partners'));

/* ------------------------------------------------------------- the scroll spy */

console.log('\n--- the spy picks the most visible section ---');
ok('nothing visible means nothing active', pickActive(new Map()) === null);
ok(
  'all zero means nothing active, not the last one seen',
  pickActive(new Map([['a', 0], ['b', 0]])) === null,
);
ok('one visible section wins', pickActive(new Map([['a', 0], ['b', 0.4]])) === 'b');
ok('the most visible wins', pickActive(new Map([['a', 0.3], ['b', 0.9], ['c', 0.5]])) === 'b');
ok(
  'a tie goes to document order, so the highlight never jumps backwards',
  pickActive(new Map([['a', 0.5], ['b', 0.5]])) === 'a',
);
ok('a barely-visible section still counts over nothing', pickActive(new Map([['a', 0.01]])) === 'a');

console.log('\n--- the observer is configured for a sticky header ---');
const opts = observerOptions(56);
ok('the top margin clears the header', opts.rootMargin.startsWith('-56px'));
ok(
  'a section must reach the upper half before it wins',
  opts.rootMargin.endsWith('-45% 0px'),
  opts.rootMargin,
);
ok('thresholds are fine-grained enough to compare sections', opts.threshold.length >= 5);

console.log('\n--- it degrades rather than breaks ---');
const src = readFileSync('src/components/layout/useActiveSection.js', 'utf8');
ok('guards against no DOM, for prerendering', src.includes("typeof document === 'undefined'"));
ok('guards against no IntersectionObserver', src.includes("typeof IntersectionObserver === 'undefined'"));
ok('disconnects on unmount', src.includes('observer.disconnect()'));
ok('re-observes after navigation', /\[key, pathname, offset\]/.test(src));
ok(
  'uses an observer, not a scroll listener',
  !/addEventListener\(\s*'scroll'/.test(src),
);

console.log(failed ? `\nNAV CHECKS FAILED (${failed})` : '\nNAV CHECKS OK');
process.exit(failed ? 1 : 0);
