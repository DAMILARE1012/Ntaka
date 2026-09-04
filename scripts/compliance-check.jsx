/**
 * The footer's data-protection strip.
 *
 * These assertions exist to keep the marketing claim tied to the implementation. The
 * consent gate check is the important one: if someone removes it from the assessor, this
 * suite fails and the footer claim has to be revisited rather than quietly becoming false.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { readFileSync } from 'node:fs';
import Footer from '../src/components/layout/Footer.jsx';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

// React 18 emits <!-- --> between adjacent text nodes; strip it so substrings match.
const html = renderToString(
  <StaticRouter location="/">
    <Footer />
  </StaticRouter>,
).replaceAll('<!-- -->', '');

console.log('\n--- the claim is present ---');
ok('footer states the position', html.includes('Your data stays yours'));
ok('names NDPA', html.includes('NDPA'));
ok('names GDPR', html.includes('GDPR'));
// This began as a check for a "Data protection" label. It is now a check that the claim
// is backed by a readable policy, which is the thing that actually matters.
ok('the claim links to a real policy', html.includes('href="/privacy"'));

console.log('\n--- the claim is specific, not a badge ---');
ok('says what happens to recordings', html.includes('discarded'));
ok('rules out selling and training', html.includes('Never sold') && html.includes('train models'));

console.log('\n--- the claim matches the code ---');
const assessor = readFileSync('server/assess-placement.js', 'utf8');
ok(
  'transcription still refuses without consent',
  /if \(!consented\)/.test(assessor),
  'server/assess-placement.js',
);
ok('audio is never written to disk', !/writeFile|createWriteStream/.test(assessor));

console.log(failed ? `\nCOMPLIANCE CHECKS FAILED (${failed})` : '\nCOMPLIANCE CHECKS OK');
process.exit(failed ? 1 : 0);
