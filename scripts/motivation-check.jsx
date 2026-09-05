/**
 * The motivation layer.
 *
 * What is being protected here is mostly the *absence* of things. It is easy to add a
 * streak counter later and not notice that it now punishes people, or to let a milestone
 * be awarded for nothing. So alongside the ordinary "does it work" assertions, this suite
 * checks that nothing decays, nothing is lost, no leaderboard exists, and that every
 * milestone requires a real action.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '../src/app/store.js';
import { sessionStarted } from '../src/dashboard/auth/authSlice.js';
import { recordPlacement } from '../src/features/learner/learnerSlice.js';
import {
  MILESTONES,
  profileFrom,
  evaluateMilestones,
  newestMilestone,
  activeDaysFrom,
} from '../src/features/motivation/milestones.js';
import PlacementCelebration from '../src/features/motivation/components/PlacementCelebration.jsx';
import MilestoneBoard from '../src/features/motivation/components/MilestoneBoard.jsx';

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

/* ------------------------------------------------------- nothing for nothing */

console.log('\n--- every milestone is earned, none are given ---');
const empty = profileFrom({ history: [], levels: {}, progress: {} });
const nothing = evaluateMilestones(empty);
ok('a brand new learner has earned none', nothing.earned.length === 0, `${nothing.total} defined`);
ok('and can see all of them as goals', nothing.locked.length === nothing.total);
ok('every milestone has real text, no placeholders', MILESTONES.every((m) => m.title && m.body && m.icon));
ok('ids are unique', new Set(MILESTONES.map((m) => m.id)).size === MILESTONES.length);

console.log('\n--- finishing the test earns the first one, immediately ---');
const afterTest = profileFrom({
  history: [
    {
      languageId: 'yoruba',
      level: 'A1',
      takenAt: '2026-09-01T10:00:00.000Z',
      summary: { speaking: { prompts: 2 }, writing: { words: 24 } },
    },
  ],
  levels: { yoruba: { level: 'A1' } },
  progress: {},
});
const earnedNow = evaluateMilestones(afterTest).earned.map((m) => m.id);
ok('"found your level" is earned', earnedNow.includes('found-your-level'));
ok('speaking is recognised', earnedNow.includes('spoke-out-loud'));
ok('writing is recognised', earnedNow.includes('wrote-something'));
ok('but nothing course-related is', !earnedNow.includes('first-lesson'));
ok('a milestone is available to celebrate', Boolean(newestMilestone(afterTest)));

console.log('\n--- a learner who skipped speaking is not credited for it ---');
const noSpeech = profileFrom({
  history: [{ languageId: 'igbo', level: 'A1', takenAt: '2026-09-01T10:00:00.000Z', summary: {} }],
  levels: { igbo: { level: 'A1' } },
  progress: {},
});
const noSpeechIds = evaluateMilestones(noSpeech).earned.map((m) => m.id);
ok('speaking milestone stays locked', !noSpeechIds.includes('spoke-out-loud'));
ok('but finishing the test still counts', noSpeechIds.includes('found-your-level'));

console.log('\n--- moving up a level is detected, and only when real ---');
const movedUp = profileFrom({
  history: [{ level: 'A2', previousLevel: 'A1', takenAt: '2026-09-02T10:00:00.000Z' }],
  levels: {},
  progress: {},
});
ok('a genuine improvement is credited', evaluateMilestones(movedUp).earned.some((m) => m.id === 'moved-up'));

const wentDown = profileFrom({
  history: [{ level: 'A1', previousLevel: 'B1', takenAt: '2026-09-02T10:00:00.000Z' }],
  levels: {},
  progress: {},
});
ok(
  'a lower retake is not dressed up as progress',
  !evaluateMilestones(wentDown).earned.some((m) => m.id === 'moved-up'),
);

/* ---------------------------------------------------------- days, not streaks */

console.log('\n--- effort is counted as days, never as a streak that can break ---');
const scattered = {
  history: [
    { takenAt: '2026-09-01T10:00:00.000Z' },
    { takenAt: '2026-09-04T10:00:00.000Z' },
  ],
  progress: {
    c1: {
      courseId: 'c1',
      enrolledAt: '2026-09-01T11:00:00.000Z',
      lessons: { l1: { status: 'complete', completedAt: '2026-09-09T10:00:00.000Z' } },
      checkpoints: {},
    },
  },
};
ok('separate days each count once', activeDaysFrom(scattered) === 3, `${activeDaysFrom(scattered)} days`);
ok('two events on one day count once', activeDaysFrom({ history: [{ takenAt: '2026-09-01T08:00:00.000Z' }, { takenAt: '2026-09-01T20:00:00.000Z' }], progress: {} }) === 1);
ok('a gap costs nothing', activeDaysFrom(scattered) === 3);

console.log('\n--- and nothing can ever be taken away ---');
// Comments are stripped first: these files EXPLAIN that there are no lives and no decay,
// so scanning their prose would flag the very documentation of the policy being enforced.
const codeOnly = (path) => {
  const BLOCK = new RegExp('/\\*[\\s\\S]*?\\*/', 'g');
  const LINE = new RegExp('(^|\\s)//.*$', 'gm');
  return readFileSync(path, 'utf8').replace(BLOCK, '').replace(LINE, '$1');
};

const src = codeOnly('src/features/motivation/milestones.js');
const board = codeOnly('src/features/motivation/components/MilestoneBoard.jsx');
const rawBoard = readFileSync('src/features/motivation/components/MilestoneBoard.jsx', 'utf8');
ok('no decay or expiry logic', !/expire|decay|revoke|deduct/i.test(src));
ok('no lives or hearts', !/\blives\b|\bhearts\b/i.test(src + board));
ok('no leaderboard or ranking against others', !/leaderboard|\brank(ing)?\b/i.test(src + board));
ok('the board says so in as many words', rawBoard.includes('no streak to break'));

// Earning more never earns less: monotonic in the inputs.
const before = evaluateMilestones(afterTest).earned.length;
const after = evaluateMilestones(
  profileFrom({
    history: afterTest.attempts,
    levels: { yoruba: { level: 'A1' } },
    progress: {
      c1: {
        courseId: 'c1',
        enrolledAt: '2026-09-02T10:00:00.000Z',
        lessons: { l1: { status: 'complete', completedAt: '2026-09-02T10:00:00.000Z' } },
        checkpoints: {},
      },
    },
  }),
).earned.length;
ok('doing more never earns fewer milestones', after >= before, `${before} then ${after}`);

/* ----------------------------------------------------------------- rendering */

console.log('\n--- the moment after the test ---');
const app = makeStore();
app.dispatch(sessionStarted({ expiresAt: Date.now() + 3.6e6, user: { id: 'u1', role: 'learner', displayName: 'Ada' } }));
app.dispatch(
  recordPlacement({
    languageId: 'yoruba',
    languageName: 'Yorùbá',
    level: 'A1',
    mode: 'full',
    confidence: 'high',
    skills: { speaking: { attempted: true, totalSeconds: 40, promptsAnswered: 2 } },
  }),
);

const render = (node) =>
  renderToString(
    <Provider store={app}>
      <StaticRouter location="/dashboard">{node}</StaticRouter>
    </Provider>,
  ).replaceAll('<!-- -->', '').replaceAll('&#x27;', "'");

const celebration = render(
  <PlacementCelebration
    result={{ level: 'A1', languageName: 'Yorùbá', skills: { speaking: { attempted: true }, writing: { attempted: true } } }}
    milestone={MILESTONES[0]}
    languageName="Yorùbá"
  />,
);
ok('it leads with what they can do', celebration.includes('what you can already do'));
ok('the effort is named back to them', celebration.includes('You spoke, you wrote'));
ok('the milestone is shown', celebration.includes('Milestone earned') && celebration.includes(MILESTONES[0].title));
ok('the level is framed as a start, not a score', celebration.includes('starting line, not a score'));
ok('heritage learners are addressed directly', celebration.includes('grew up hearing'));
ok('there is one obvious next action', celebration.includes('Start your first lesson'));

const cando = celebration.indexOf('what you can already do');
const levelCode = celebration.indexOf('A1 —');
ok('can-do comes before the level code', cando > -1 && levelCode > cando);

console.log('\n--- the board ---');
const boardHtml = render(<MilestoneBoard />);
ok('earned milestones show as earned', boardHtml.includes('Earned'));
ok('locked ones are readable, not hidden behind question marks', boardHtml.includes('Ten lessons in'));
ok('progress out of the total is shown', /\d+ of \d+ earned|of \d+ earned/.test(boardHtml.replace(/<[^>]+>/g, ' ')));
ok('no padlock placeholders', !boardHtml.includes('???'));

console.log('\n--- dashboard only, never public ---');
const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const f = `${d}/${e}`;
    if (statSync(f).isDirectory()) walk(f, out);
    else if (/\.jsx?$/.test(f)) out.push(f);
  }
  return out;
};
const publicFiles = ['src/pages', 'src/features/home'].flatMap((d) => walk(d));
ok(
  'no public page imports the motivation layer',
  !publicFiles.some((f) => /features\/motivation/.test(readFileSync(f, 'utf8'))),
  `${publicFiles.length} files scanned`,
);

console.log(failed ? `\nMOTIVATION CHECKS FAILED (${failed})` : '\nMOTIVATION CHECKS OK');
process.exit(failed ? 1 : 0);
