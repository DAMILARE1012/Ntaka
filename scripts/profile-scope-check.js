/**
 * Placement results are profile data.
 *
 * Two failure modes, and this suite covers both because they fail silently:
 *
 *   1. A public page shows someone's level. Nothing errors — the page just quietly
 *      displays private data to whoever is looking at the screen, and on a prerendered
 *      page it also desynchronises the served HTML from the hydrated HTML.
 *   2. Two people share a browser and the second inherits the first's results. Nothing
 *      errors here either; the second person simply sees a level they never earned.
 *
 * The first is checked by reading the source of every public surface, so a new page that
 * reaches for learner state fails here rather than in production. The second is checked
 * by actually driving a store through sign in, place, sign out, sign in as someone else.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

/* ------------------------------------------------------ 1. no leaks in source */

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(full)) out.push(full);
  }
  return out;
};

/**
 * Everything a signed-out visitor can reach. `src/dashboard` is deliberately absent —
 * that is the one place a level is supposed to appear — and so is
 * `src/features/placement`, which owns both the test and the gate.
 */
const PUBLIC_DIRS = [
  'src/pages',
  'src/features/home',
  'src/features/languages',
  'src/features/teachers',
  'src/features/classes',
  'src/components',
];

/** Reading a placement to *decide* something is fine; the gate must. Displaying is not. */
const LEVEL_READERS = /selectLevelFor|selectLearner\b|selectHistory/;

const publicFiles = PUBLIC_DIRS.filter((dir) => {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}).flatMap((dir) => walk(dir));

const readers = publicFiles.filter((file) => {
  const src = readFileSync(file, 'utf8');
  return src.includes('learnerSlice') && LEVEL_READERS.test(src);
});
ok(
  'no public page reads placement state',
  readers.length === 0,
  readers.length ? readers.map((f) => relative('.', f)).join(', ') : `${publicFiles.length} files scanned`,
);

const ladders = publicFiles.filter((file) => /<LevelLadder[^>]*\bcurrent=/.test(readFileSync(file, 'utf8')));
ok(
  'no public page marks a level on the ladder',
  ladders.length === 0,
  ladders.length ? ladders.map((f) => relative('.', f)).join(', ') : 'no "You are here" outside the dashboard',
);

const banner = readFileSync('src/features/home/components/PlacementBanner.jsx', 'utf8');
ok('homepage band has no personalised branch', !/Welcome back/.test(banner));

/* ------------------------------------------------- 2. storage is per profile */

const slice = readFileSync('src/features/learner/learnerSlice.js', 'utf8');
ok('storage key is namespaced by user', /keyFor\s*=\s*\(userId\)/.test(slice));
ok('nothing is persisted while signed out', /if \(!userId\) return result;/.test(slice));
ok('signing out empties the slice', /addCase\(sessionEnded/.test(slice));
ok('signing in loads that user profile', /addCase\(sessionStarted/.test(slice));

/* --------------------------------------------- 3. prove it with a real store */

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

async function main() {
  const { makeStore } = await import('../src/app/store.js');
  const { sessionStarted, sessionEnded } = await import('../src/dashboard/auth/authSlice.js');
  const { recordPlacement, selectLevelFor, selectHistory } = await import(
    '../src/features/learner/learnerSlice.js'
  );

  const signIn = (s, id) =>
    s.dispatch(sessionStarted({ expiresAt: Date.now() + 3.6e6, user: { id, role: 'learner' } }));

  const place = (s, level) =>
    s.dispatch(
      recordPlacement({ languageId: 'yoruba', languageName: 'Yoruba', level, mode: 'full', confidence: 'high' }),
    );

  console.log('\n--- a result follows the profile, not the browser ---');

  const first = makeStore();
  signIn(first, 'user-a');
  place(first, 'B1');
  ok('the learner sees their own level', selectLevelFor('yoruba')(first.getState()) === 'B1');
  ok('and their own history', selectHistory(first.getState()).length === 1);

  first.dispatch(sessionEnded());
  ok('signing out clears it from memory', !selectLevelFor('yoruba')(first.getState()));
  ok('and clears the history', selectHistory(first.getState()).length === 0);

  signIn(first, 'user-b');
  ok(
    'the next person on this browser inherits nothing',
    !selectLevelFor('yoruba')(first.getState()) && selectHistory(first.getState()).length === 0,
  );

  place(first, 'A1');
  signIn(first, 'user-a');
  ok('the first learner gets their own result back', selectLevelFor('yoruba')(first.getState()) === 'B1');
  ok('not the second learner’s', selectLevelFor('yoruba')(first.getState()) !== 'A1');

  console.log('\n--- signed out, nothing is written ---');
  const anon = makeStore();
  const before = Object.keys(store).length;
  place(anon, 'C1');
  ok('an anonymous result is never persisted', Object.keys(store).length === before);

  console.log('\n--- the legacy shared key is gone ---');
  store['ntaka.learner.v1'] = JSON.stringify({ levels: { yoruba: { level: 'C2' } } });
  const fresh = makeStore();
  signIn(fresh, 'user-c');
  ok('an unattributable blob is discarded, not adopted', !selectLevelFor('yoruba')(fresh.getState()));
  ok('and removed from storage', !('ntaka.learner.v1' in store));

  console.log(failed ? `\nPROFILE SCOPE CHECKS FAILED (${failed})` : '\nPROFILE SCOPE CHECKS OK');
  process.exit(failed ? 1 : 0);
}

main();
