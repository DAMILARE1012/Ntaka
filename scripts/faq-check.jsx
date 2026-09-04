/**
 * The FAQ page.
 *
 * The interesting assertions are in the last two sections. An FAQ rots differently from
 * other pages: nothing breaks when an answer becomes wrong, it just quietly misinforms
 * people. So this suite reads the real constants — join window, lead time, transcription
 * coverage, level cap — and fails when an answer stops matching the code it describes.
 */
import { renderToString } from 'react-dom/server';
import { beginHeadCapture, endHeadCapture } from '../src/components/common/Seo.jsx';
import { StaticRouter } from 'react-router-dom/server';
import { Provider } from 'react-redux';
import { makeStore } from '../src/app/store.js';
import FaqPage from '../src/pages/FaqPage.jsx';
import Navbar from '../src/components/layout/Navbar.jsx';
import { FAQS, FAQ_CATEGORIES, faqsByCategory, TOP_FAQ_IDS } from '../src/services/mock/faqs.js';
import { faqPage } from '../src/lib/structuredData.js';
import { STATIC_SEO } from '../src/lib/seo.js';
import { JOIN_OPENS_BEFORE_MIN, JOIN_CLOSES_AFTER_MIN } from '../src/lib/meetings.js';
import { LEAD_TIME_MIN } from '../src/lib/booking.js';
import { WHISPER_LANGUAGES } from '../src/lib/groqAssessment.js';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

/*
 * React escapes apostrophes and quotes in text nodes, and emits <!-- --> between adjacent
 * ones. Undo both, so assertions can be written against the strings as authored.
 */
const decode = (markup) =>
  markup
    .replaceAll('<!-- -->', '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');

const render = (node) =>
  decode(
    renderToString(
      <Provider store={makeStore()}>
        <StaticRouter location="/faq">{node}</StaticRouter>
      </Provider>,
    ),
  );

/*
 * <Seo> renders nothing into the body - it writes into the registry the prerenderer
 * drains. Capturing it here is what the static build actually does with the page.
 */
beginHeadCapture();
const html = render(<FaqPage />);
const head = endHeadCapture();
const nav = render(<Navbar />);
const answerOf = (id) => FAQS.find((faq) => faq.id === id)?.answer ?? '';

console.log('\n--- reachable ---');
ok('FAQ is in the navbar', nav.includes('>FAQ<'));
ok('navbar points at /faq', nav.includes('href="/faq"'));
ok('page renders', html.includes('Frequently asked questions'));

console.log('\n--- structure ---');
ok('every category renders', FAQ_CATEGORIES.every((c) => html.includes(`id="${c.id}"`)));
ok('every question renders', FAQS.every((faq) => html.includes(faq.question)));
ok(
  'every answer is in the HTML, not fetched on expand',
  FAQS.every((faq) => html.includes(faq.answer.slice(0, 40))),
  `${FAQS.length} answers`,
);
ok('uses native details/summary', html.includes('<details') && html.includes('<summary'));
ok('categories are all populated', faqsByCategory().length === FAQ_CATEGORIES.length);
ok('no duplicate ids', new Set(FAQS.map((f) => f.id)).size === FAQS.length);
ok('featured questions exist', TOP_FAQ_IDS.every((id) => FAQS.some((f) => f.id === id)));

console.log('\n--- structured data ---');
const jsonLd = faqPage({ ...STATIC_SEO.faq, faqs: FAQS });
ok('is an FAQPage', jsonLd['@type'] === 'FAQPage');
ok('every question is marked up', jsonLd.mainEntity.length === FAQS.length);
ok(
  'marked-up answers match the visible ones',
  jsonLd.mainEntity.every((q, i) => q.acceptedAnswer.text === FAQS[i].answer),
);
ok(
  'page emits the JSON-LD into the head',
  head.jsonLd.some((node) => node['@graph']?.some((n) => n['@type'] === 'FAQPage')),
);
ok('canonical points at /faq', head.link.some((l) => l.href.endsWith('/faq')));

console.log('\n--- answers still match the code ---');
ok(
  `join window is ${JOIN_OPENS_BEFORE_MIN} before / ${JOIN_CLOSES_AFTER_MIN} after`,
  answerOf('where-lessons-happen').includes(`${JOIN_OPENS_BEFORE_MIN} minutes before`) &&
    answerOf('where-lessons-happen').includes(`${JOIN_CLOSES_AFTER_MIN} minutes after`),
);
ok(
  `booking lead time is ${LEAD_TIME_MIN} minutes`,
  LEAD_TIME_MIN === 120 && answerOf('booking-notice').includes('two hours'),
);
ok(
  'Igbo is still untranscribable, as the answer claims',
  !WHISPER_LANGUAGES.igbo && answerOf('placement-igbo-speaking').includes('Igbo currently cannot'),
);
ok(
  'languages named as transcribable really are',
  ['yoruba', 'hausa', 'swahili', 'amharic', 'somali', 'shona', 'lingala'].every(
    (id) => WHISPER_LANGUAGES[id],
  ),
);

console.log('\n--- the answers do not overclaim ---');
ok(
  'writing cap is stated as B1',
  answerOf('placement-machine-marked').includes('never place you above B1'),
);
ok('speaking is stated as never machine-scored', answerOf('placement-machine-marked').includes('never scored'));
ok(
  'the placement gate is explained, not just asserted',
  answerOf('why-placement-required').includes('once per language'),
);
ok(
  'privacy answer matches the footer claim',
  answerOf('data-compliance').includes('NDPA') &&
    answerOf('data-compliance').includes('GDPR') &&
    answerOf('recordings-kept').includes('discarded'),
);

console.log(failed ? `\nFAQ CHECKS FAILED (${failed})` : '\nFAQ CHECKS OK');
process.exit(failed ? 1 : 0);
