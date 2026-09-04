import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '@/app/store';
import { ntakaApi } from '@/services/api';
import App from '@/App';
import { PARTNERS } from '@/services/mock/partners';

async function main() {
  let fails = 0;
  const check = (label, ok, extra = '') => {
    console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
    if (!ok) fails += 1;
  };

  const store = makeStore({ devChecks: false });
  await Promise.all([
    store.dispatch(ntakaApi.endpoints.getPlatformStats.initiate(undefined)),
    store.dispatch(ntakaApi.endpoints.getLanguages.initiate({})),
  ]);

  const html = renderToString(
    React.createElement(Provider, { store },
      React.createElement(StaticRouter, { location: '/' }, React.createElement(App))),
  ).split('<!-- -->').join('');

  console.log('--- the slider ---');
  check('marquee track present', html.includes('marquee-track'));
  check('runs in reverse, opposite the language rail', html.includes('marquee-track--reverse'));
  check('two groups for a seamless loop', (html.match(/marquee-track[\s\S]*?<\/div>/)?.[0].match(/<ul/g) || []).length === 2);
  check('duration set from content', /--marquee-duration:\s*[\d.]+s/.test(html));

  console.log('');
  console.log('--- content ---');
  const logos = html.match(/\/partners\/[A-Za-z_]+\.webp/g) || [];
  check('every partner appears', PARTNERS.every((p) => html.includes(p.shortName ?? p.name)));
  // The list is repeated until a group clears the widest container, then the whole track
  // is two groups - so the logo count is a multiple of the partner count, not exactly 2x.
  check('logos repeat in whole sets', logos.length % PARTNERS.length === 0, logos.length + ' img');
  check('enough repeats to fill a wide screen', logos.length >= PARTNERS.length * 2);
  check('slides link to the partners page', html.includes('href="/partners"'));
  check('slides carry no card chrome', !html.includes('rounded-xl border border-line bg-bg p-4'));

  console.log('');
  console.log('--- accessibility ---');
  const uls = html.match(/<ul[^>]*>/g) || [];
  const track = html.slice(html.indexOf('marquee-track--reverse'));
  const trackUls = track.match(/<ul[^>]*>/g) || [];
  check('duplicate group hidden from screen readers', /aria-hidden="true"/.test(trackUls[1] || ''));
  check('first group is exposed', !/aria-hidden/.test(trackUls[0] || ''));
  const dupLinks = (track.match(/tabindex="-1"/g) || []).length;
  check('duplicate links are out of the tab order', dupLinks === logos.length / 2, dupLinks + ' untabbable');
  check('alt text names the organisation', /alt="[^"]*Museum of Acholi[^"]*logo"/.test(html));

  console.log('');
  console.log('--- navigation ---');
  check('section is an anchor target', html.includes('id="partners"'));
  check('anchor clears the sticky header', /id="partners"[^>]*scroll-mt-16|scroll-mt-16[^>]*id="partners"/.test(html));
  check('navbar points at the homepage section', html.includes('href="/#partners"'));
  check('the band links on to the sub-page', html.includes('See all partners'));

  console.log('');
  console.log('--- the partners page still works ---');
  const page = renderToString(
    React.createElement(Provider, { store },
      React.createElement(StaticRouter, { location: '/partners' }, React.createElement(App))),
  ).split('<!-- -->').join('');
  check('page is a grid, not a slider', !page.includes('marquee-track'));
  check('all partners listed once', PARTNERS.every((p) => page.includes(p.name)));

  console.log('');
  console.log(fails ? fails + ' CHECK(S) FAILED' : 'PARTNERS CHECKS OK');
  if (fails) process.exitCode = 1;
}
main();
