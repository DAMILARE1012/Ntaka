/**
 * The legal pages.
 *
 * A privacy policy is the one document on the site that must not drift from the code. The
 * assertions below therefore read the implementation, not a copy of it: the storage keys
 * come from the slices that set them, and the consent gate is checked in the assessor that
 * enforces it. If someone adds a provider, renames a key, or removes the consent check,
 * this fails — which is the only reliable way to keep a policy true over time.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Provider } from 'react-redux';
import { readFileSync } from 'node:fs';
import { beginHeadCapture, endHeadCapture } from '../src/components/common/Seo.jsx';
import { makeStore } from '../src/app/store.js';
import PrivacyPage from '../src/pages/legal/PrivacyPage.jsx';
import TermsPage from '../src/pages/legal/TermsPage.jsx';
import CookiesPage from '../src/pages/legal/CookiesPage.jsx';
import Footer from '../src/components/layout/Footer.jsx';
import { PRIVACY, TERMS, COOKIES, SUBPROCESSORS, STORAGE_ITEMS } from '../src/content/legal.js';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

const decode = (m) =>
  m
    .replaceAll('<!-- -->', '')
    .replaceAll('&#x27;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&');

const render = (node, location) =>
  decode(
    renderToString(
      <Provider store={makeStore()}>
        <StaticRouter location={location}>{node}</StaticRouter>
      </Provider>,
    ),
  );

beginHeadCapture();
const privacy = render(<PrivacyPage />, '/privacy');
const privacyHead = endHeadCapture();
const terms = render(<TermsPage />, '/terms');
const cookies = render(<CookiesPage />, '/cookies');
const footer = render(<Footer />, '/');

console.log('\n--- reachable ---');
ok('footer links to privacy', footer.includes('href="/privacy"'));
ok('footer links to terms', footer.includes('href="/terms"'));
ok('footer links to cookies', footer.includes('href="/cookies"'));
ok('no placeholder legal spans remain', !/<span>(Privacy|Terms|Cookies)<\/span>/.test(footer));

console.log('\n--- the pages render in full ---');
ok('privacy renders every section', PRIVACY.every((s) => privacy.includes(s.heading)));
ok('terms renders every section', TERMS.every((s) => terms.includes(s.heading)));
ok('cookies renders every section', COOKIES.every((s) => cookies.includes(s.heading)));
ok('privacy is dated', privacy.includes('Last updated'));
ok('privacy is canonical at /privacy', privacyHead.link.some((l) => l.href.endsWith('/privacy')));

console.log('\n--- sub-processors are named, not implied ---');
ok('Groq is named', privacy.includes('Groq') && SUBPROCESSORS.some((p) => p.name === 'Groq'));
ok('Daily.co is named', privacy.includes('Daily.co'));
ok('every provider states what it receives', SUBPROCESSORS.every((p) => p.data && p.region));
ok('every provider is rendered', SUBPROCESSORS.every((p) => privacy.includes(p.purpose)));

console.log('\n--- the policy matches the code ---');
const assessor = readFileSync('server/assess-placement.js', 'utf8');
const learner = readFileSync('src/features/learner/learnerSlice.js', 'utf8');
const auth = readFileSync('src/dashboard/auth/authSlice.js', 'utf8');
const groq = readFileSync('src/lib/groqAssessment.js', 'utf8');

ok('consent really does gate transcription', /if \(!consented\)/.test(assessor));
ok(
  'the Igbo carve-out is real',
  !/\bigbo:/.test(groq.slice(groq.indexOf('WHISPER_LANGUAGES'), groq.indexOf('isTranscribable'))),
);
ok(
  'the session key in the cookie policy exists',
  auth.includes("'ntaka.session.v1'") &&
    STORAGE_ITEMS.some((i) => i.key === 'ntaka.session.v1'),
);
ok(
  'the learner key in the cookie policy is the namespaced one',
  learner.includes("'ntaka.learner.v1'") &&
    STORAGE_ITEMS.some((i) => i.key.startsWith('ntaka.learner.v1:')),
);
ok(
  'every documented item is rendered on the page',
  STORAGE_ITEMS.every((i) => cookies.includes(i.purpose)),
);

console.log('\n--- claims stay inside what we can support ---');
const all = `${privacy} ${terms} ${cookies}`;
ok('no certification is claimed', !/ISO 27001|SOC 2|HIPAA certified/i.test(all));
ok('recordings are said to be discarded', privacy.includes('discarded'));
ok('training on user data is ruled out', privacy.includes('train models'));
ok(
  'certificates are not passed off as accreditation',
  terms.includes('not a state or university qualification'),
);

console.log(failed ? `\nLEGAL CHECKS FAILED (${failed})` : '\nLEGAL CHECKS OK');
process.exit(failed ? 1 : 0);
