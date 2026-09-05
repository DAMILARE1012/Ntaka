import { LEVEL_CODES, levelIndex } from '@/lib/cefr';

/**
 * One ranking for Interactive Learning courses, used everywhere courses are ordered.
 *
 * The reason it is one function rather than three is synchronisation. The marketing page,
 * the placement result and the dashboard all show courses, and if each sorted them its own
 * way the journey would contradict itself: a course featured on the homepage would vanish
 * after signing in, and the one the test recommended would not be the one waiting on the
 * dashboard. Here, the *ranking* is fixed and only the *evidence* changes — signed out
 * there is no placement, so it falls back to popularity; signed in with a result, the same
 * comparator gets a level to work with.
 *
 * Nothing in here reads Redux or touches storage. It takes a profile and returns a list,
 * which is what makes it testable and what stops placement data leaking into a page that
 * merely wanted a sorted list of courses.
 */

/** Why a course is being shown. The learner sees this, so it has to be true. */
export const REASONS = {
  CONTINUE: 'continue',
  AT_LEVEL: 'at-level',
  NEXT_LEVEL: 'next-level',
  REVIEW: 'review',
  OTHER_LANGUAGE: 'other-language',
  POPULAR: 'popular',
};

const REASON_TEXT = {
  [REASONS.CONTINUE]: 'You started this',
  [REASONS.AT_LEVEL]: 'Matches your level',
  [REASONS.NEXT_LEVEL]: 'The level after yours',
  [REASONS.REVIEW]: 'Below your level — good for filling gaps',
  [REASONS.OTHER_LANGUAGE]: 'A language you have placed in',
  [REASONS.POPULAR]: 'Popular with new learners',
};

export const reasonText = (reason) => REASON_TEXT[reason] ?? '';

/**
 * Score one course against a learner profile. Higher is better.
 *
 * The weights encode a few opinions worth being explicit about:
 *
 *   * An unfinished course outranks any new one. The most common reason someone abandons
 *     a language is losing the thread, and a half-finished course is the thread.
 *   * A course at the learner's exact level beats one a level above, which beats one a
 *     level below. Below is still offered, because a gap at A2 is a real reason to drop
 *     back, but it is never the first thing suggested.
 *   * More than one level away is effectively excluded rather than merely deprioritised.
 *     Showing a B2 course to an A1 learner is how someone decides the platform does not
 *     understand them.
 *   * Finished courses fall to the bottom instead of disappearing, so a learner can find
 *     something they completed.
 */
function scoreCourse(course, { level, progressFor, placedLanguages }) {
  const entry = progressFor?.(course.id) ?? null;
  const started = Boolean(entry);
  const finished = entry?.percent === 100;

  let score = 0;
  let reason = REASONS.POPULAR;

  if (started && !finished) {
    score += 1000;
    reason = REASONS.CONTINUE;
  }

  if (level) {
    const distance = levelIndex(course.level) - levelIndex(level);
    if (distance === 0) {
      score += 400;
      if (!started) reason = REASONS.AT_LEVEL;
    } else if (distance === 1) {
      score += 260;
      if (!started) reason = REASONS.NEXT_LEVEL;
    } else if (distance === -1) {
      score += 120;
      if (!started) reason = REASONS.REVIEW;
    } else {
      // Two levels out in either direction: present but never surfaced first.
      score -= 300;
    }
  } else if (placedLanguages?.includes(course.languageId)) {
    score += 150;
    reason = REASONS.OTHER_LANGUAGE;
  }

  // Popularity, kept small so it breaks ties rather than deciding them.
  score += Math.min(course.enrolled ?? 0, 12000) / 400;
  score += (course.rating ?? 0) * 6;

  /*
   * No bonus for open courses any more. It made sense when courses were bought one at a
   * time and a free one was a cheaper first step. Under a subscription the catalogue
   * should be ordered by which course is best for this learner, not by which happens to
   * be outside the paywall - and in practice the bonus filled the whole first page with
   * open courses, hiding the thing the subscription actually buys. They are still
   * labelled "Free to read", which is the honest way to surface them.
   */

  if (finished) score -= 2000;

  return { score, reason, started, finished, percent: entry?.percent ?? 0 };
}

/**
 * The comparator itself, exported so the public course listing can sort by exactly the
 * same rule the dashboard does.
 *
 * This is what "synchronised" means concretely: signed out, `levels` is empty and the
 * scoring collapses to popularity and rating, which is a sensible marketing order. Signed
 * in after a test, the same comparator gets a level and reorders around it. There is no
 * second implementation to drift.
 */
export function courseComparator({ levels = {}, progressFor = null } = {}) {
  const placed = Object.keys(levels);
  const cache = new Map();
  const scoreOf = (course) => {
    if (!cache.has(course.id)) {
      const level = levels[course.languageId]?.level ?? null;
      cache.set(course.id, scoreCourse(course, { level, progressFor, placedLanguages: placed }).score);
    }
    return cache.get(course.id);
  };
  return (a, b) => scoreOf(b) - scoreOf(a) || a.title.localeCompare(b.title);
}

/**
 * Rank courses for a learner.
 *
 * `levels` is the per-language placement map from the learner profile — pass `{}` or omit
 * it for the signed-out case, which is exactly what the marketing pages do.
 */
export function recommendCourses({
  courses = [],
  levels = {},
  progressFor = null,
  languageId = null,
  limit = 6,
} = {}) {
  const placedLanguages = Object.keys(levels);

  // A language was asked for: honour it. Otherwise, if the learner has placed in exactly
  // one language, that is plainly the one they are learning; with several, show all and
  // let the level distance sort them.
  const focus = languageId ?? (placedLanguages.length === 1 ? placedLanguages[0] : null);

  const pool = focus ? courses.filter((c) => c.languageId === focus) : courses;

  return pool
    .map((course) => {
      const level = levels[course.languageId]?.level ?? null;
      return { course, ...scoreCourse(course, { level, progressFor, placedLanguages }) };
    })
    .sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title))
    .slice(0, limit);
}

/**
 * Which languages the learner has placed in, newest first.
 *
 * This is the "memory" the placement gate runs on: a learner who has tested in Yorùbá is
 * never asked to test in Yorùbá again, but starting Igbo is a new language and needs its
 * own result. A level in one language says nothing about another.
 */
export function placedLanguages(levels = {}) {
  return Object.entries(levels)
    .map(([languageId, entry]) => ({
      languageId,
      level: entry.level,
      takenAt: entry.takenAt,
      mode: entry.mode,
    }))
    .sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));
}

/** Has this learner already placed in this language? The whole of the memory rule. */
export const hasPlacedIn = (levels, languageId) => Boolean(levels?.[languageId]?.level);

/**
 * Languages worth offering as "place another language", i.e. everything they teach that
 * this learner has not already tested. Returning an empty list is meaningful: it means
 * they have placed in everything, and the caller should say so rather than show a picker.
 */
export function unplacedLanguages(levels = {}, allLanguages = []) {
  return allLanguages.filter((language) => !hasPlacedIn(levels, language.id));
}

export { LEVEL_CODES };
