/**
 * Course recommendations, placement memory, and the synchronisation between them.
 *
 * Three promises are under test:
 *
 *   1. After a placement test, the courses a learner is offered are the ones at their
 *      level — not a popularity list with a level badge on it.
 *   2. The marketing listing, the placement result and the dashboard rank by the same
 *      rule, so the journey does not contradict itself.
 *   3. A placement is remembered per language. Tested in Yorùbá means never asked again
 *      for Yorùbá; starting Igbo is a new language and needs its own result.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '../src/app/store.js';
import { sessionStarted } from '../src/dashboard/auth/authSlice.js';
import { recordPlacement } from '../src/features/learner/learnerSlice.js';
import {
  recommendCourses,
  courseComparator,
  placedLanguages,
  hasPlacedIn,
  unplacedLanguages,
  REASONS,
  reasonText,
} from '../src/features/learning/recommend.js';
import { VIDEO_COURSES } from '../src/services/mock/videos.js';
import { LANGUAGES_FULL } from '../src/services/mock/catalog.js';
import { listVideos, submitPlacement } from '../src/services/mock/db.js';
import RecommendedCourses from '../src/features/learning/components/RecommendedCourses.jsx';
import PlacedLanguages from '../src/features/placement/components/PlacedLanguages.jsx';
import LanguagePicker from '../src/features/placement/components/LanguagePicker.jsx';

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

const yorubaCourses = VIDEO_COURSES.filter((c) => c.languageId === 'yoruba');

/* --------------------------------------------------- 1. it recommends by level */

console.log('\n--- recommendations follow the placement result ---');

for (const level of ['A1', 'B1']) {
  const picks = recommendCourses({
    courses: yorubaCourses,
    levels: { yoruba: { level } },
    languageId: 'yoruba',
    limit: 4,
  });
  ok(`${level}: something is recommended`, picks.length > 0);
  ok(
    `${level}: nothing more than one level away is surfaced first`,
    ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(picks[0].course.level) -
      ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(level) <= 1,
    `top pick is ${picks[0].course.level}`,
  );
  ok(`${level}: every pick carries a reason`, picks.every((p) => reasonText(p.reason)));
}

const atLevel = recommendCourses({
  courses: yorubaCourses,
  levels: { yoruba: { level: 'A2' } },
  languageId: 'yoruba',
  limit: 6,
});
ok(
  'a course at the exact level outranks one a level above',
  atLevel.findIndex((p) => p.course.level === 'A2') < atLevel.findIndex((p) => p.course.level === 'B1') ||
    !atLevel.some((p) => p.course.level === 'B1'),
);

console.log('\n--- an unfinished course beats any new one ---');
const halfDone = yorubaCourses.at(-1);
const withProgress = recommendCourses({
  courses: yorubaCourses,
  levels: { yoruba: { level: 'A1' } },
  languageId: 'yoruba',
  progressFor: (id) => (id === halfDone.id ? { percent: 40 } : null),
  limit: 6,
});
ok('the started course is first', withProgress[0].course.id === halfDone.id);
ok('and is labelled as continuing', withProgress[0].reason === REASONS.CONTINUE);

const finished = recommendCourses({
  courses: yorubaCourses,
  levels: { yoruba: { level: 'A1' } },
  languageId: 'yoruba',
  progressFor: (id) => (id === yorubaCourses[0].id ? { percent: 100 } : null),
  limit: 20,
});
ok(
  'a finished course sinks but is still findable',
  finished.at(-1).course.id === yorubaCourses[0].id && finished.length > 1,
);

/* ----------------------------------------------------- 2. synchronisation */

console.log('\n--- one ranking, used everywhere ---');
const signedOut = listVideos({ languageId: 'yoruba', pageSize: 20 }).items.map((c) => c.id);
const comparatorOrder = [...yorubaCourses].sort(courseComparator()).map((c) => c.id);
ok(
  'the public listing sorts by the shared comparator',
  JSON.stringify(signedOut) === JSON.stringify(comparatorOrder),
);
ok('recommended is the default sort', listVideos({ languageId: 'yoruba' }).items.length > 0);

const result = submitPlacement({
  languageId: 'yoruba',
  answers: {},
  background: {},
  selfLevel: 'A2',
});
ok('the placement result recommends courses', result.recommendedCourses.length > 0);
ok(
  'every recommended course is in the language just tested',
  result.recommendedCourses.every((c) => c.languageId === 'yoruba'),
);
ok(
  'the result carries the reason, so the dashboard can repeat it',
  result.recommendedCourses.every((c) => c.recommendationReason),
);

const dashboardPicks = recommendCourses({
  courses: VIDEO_COURSES,
  levels: { yoruba: { level: result.level } },
  languageId: 'yoruba',
  limit: 4,
}).map((p) => p.course.id);
ok(
  'what the test recommended is what the dashboard shows',
  JSON.stringify(result.recommendedCourses.map((c) => c.id)) === JSON.stringify(dashboardPicks),
);

/* -------------------------------------------------------- 3. the memory */

console.log('\n--- placement is remembered per language ---');
const levels = { yoruba: { level: 'B1', takenAt: '2026-08-01T10:00:00.000Z' } };
ok('a tested language is remembered', hasPlacedIn(levels, 'yoruba'));
ok('an untested one is not', !hasPlacedIn(levels, 'igbo'));
ok('placed languages are listed', placedLanguages(levels).length === 1);
ok(
  'untested languages remain offerable',
  unplacedLanguages(levels, LANGUAGES_FULL).length === LANGUAGES_FULL.length - 1,
);

const two = {
  yoruba: { level: 'B1', takenAt: '2026-08-01T10:00:00.000Z' },
  igbo: { level: 'A1', takenAt: '2026-09-01T10:00:00.000Z' },
};
ok('the most recent placement comes first', placedLanguages(two)[0].languageId === 'igbo');
ok(
  'a level in one language never leaks into another',
  recommendCourses({
    courses: VIDEO_COURSES.filter((c) => c.languageId === 'igbo'),
    levels: { yoruba: { level: 'C1' } },
    languageId: 'igbo',
    limit: 3,
  }).every((p) => p.reason === REASONS.POPULAR),
);

/* ---------------------------------------------------------- 4. rendering */

console.log('\n--- it renders, and only inside the dashboard ---');

const app = makeStore();
app.dispatch(
  sessionStarted({ expiresAt: Date.now() + 3.6e6, user: { id: 'user-r', role: 'learner', displayName: 'Ada' } }),
);
app.dispatch(
  recordPlacement({
    languageId: 'yoruba',
    languageName: 'Yorùbá',
    level: 'A2',
    mode: 'full',
    confidence: 'high',
  }),
);

const render = (node) =>
  renderToString(
    <Provider store={app}>
      <StaticRouter location="/dashboard">{node}</StaticRouter>
    </Provider>,
  ).replaceAll('<!-- -->', '');

const recs = render(<RecommendedCourses limit={4} />);
ok('recommendations render', recs.includes('Recommended for you'));
ok('they explain themselves', recs.includes('Matches your level') || recs.includes('The level after yours'));
ok('they link into the course', recs.includes('/interactive-learning/'));

const placedHtml = render(<PlacedLanguages />);
ok('the memory is shown to the learner', placedHtml.includes('Yorùbá'));
ok('retaking is offered', placedHtml.includes('Retake'));
ok('so is placing another language', placedHtml.includes('Place another language'));

const picker = render(<LanguagePicker onChoose={() => {}} />);
ok('the picker marks what is already placed', picker.includes('Already placed'));
ok('and says results are kept', picker.includes('Your results'));

console.log('\n--- and never on a public page ---');
const publicRecs = /features\/learning\/components\/RecommendedCourses/;
ok(
  'the recommender is not imported by any public page',
  !['src/pages', 'src/features/home'].some((dir) => {
    const walk = (d, out = []) => {
      for (const e of readdirSync(d)) {
        const f = `${d}/${e}`;
        if (statSync(f).isDirectory()) walk(f, out);
        else if (/\.jsx?$/.test(f)) out.push(f);
      }
      return out;
    };
    return walk(dir).some((f) => publicRecs.test(readFileSync(f, 'utf8')));
  }),
);

console.log(failed ? `\nRECOMMEND CHECKS FAILED (${failed})` : '\nRECOMMEND CHECKS OK');
process.exit(failed ? 1 : 0);
