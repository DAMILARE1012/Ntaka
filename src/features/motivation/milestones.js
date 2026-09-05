/**
 * Milestones — the motivation layer.
 *
 * Three rules govern everything in here, and they are the reason this is not a points
 * system:
 *
 *   1. EARNED, NEVER GIVEN. Every milestone corresponds to something the learner actually
 *      did. Nothing is awarded for showing up, because a reward for nothing devalues the
 *      ones that mean something.
 *   2. NEVER TAKEN AWAY. There is no streak to lose, no lives to run out, no decay. A
 *      mechanic that punishes absence punishes exactly the person who was about to come
 *      back after a hard fortnight, which is the moment retention is actually won or lost.
 *   3. HONEST. The text describes what they did in plain language. "Spoke out loud" is
 *      true and worth being proud of; "Level 4 Language Master" is neither.
 *
 * The first milestone is earned by finishing the placement test itself — about six minutes
 * in. That is deliberate: the test is a mandatory gate and it feels like judgment, so the
 * moment it ends is the moment a learner most needs to be told they got somewhere.
 *
 * Evaluation is pure and derived from state that already exists. Nothing new is persisted,
 * which also means there is no new place for profile data to leak from.
 */

export const TIERS = {
  START: 'start',
  PRACTICE: 'practice',
  DEPTH: 'depth',
};

/**
 * `earned` receives the learner's derived profile and returns true or false. Keep each one
 * cheap and total — they run on every dashboard render.
 */
export const MILESTONES = [
  {
    id: 'found-your-level',
    tier: TIERS.START,
    icon: 'target',
    title: 'Found your level',
    body: 'You finished the placement test. Most people never get past deciding to start.',
    earned: ({ attempts }) => attempts.length > 0,
  },
  {
    id: 'spoke-out-loud',
    tier: TIERS.START,
    icon: 'mic',
    title: 'Spoke out loud',
    body: 'You recorded yourself speaking. That is the part almost everyone skips.',
    earned: ({ attempts }) => attempts.some((a) => a.summary?.speaking?.prompts > 0),
  },
  {
    id: 'wrote-something',
    tier: TIERS.START,
    icon: 'book',
    title: 'Wrote your first sentences',
    body: 'Writing is where a phrase stops being something you recognise and becomes something you own.',
    earned: ({ attempts }) => attempts.some((a) => a.summary?.writing?.words > 0),
  },
  {
    id: 'first-lesson',
    tier: TIERS.PRACTICE,
    icon: 'play',
    title: 'First lesson done',
    body: 'One lesson finished. The next one is easier than the first, always.',
    earned: ({ lessonsCompleted }) => lessonsCompleted >= 1,
  },
  {
    id: 'ten-lessons',
    tier: TIERS.PRACTICE,
    icon: 'bolt',
    title: 'Ten lessons in',
    body: 'Ten lessons is the point where the language starts sounding like a language rather than noise.',
    earned: ({ lessonsCompleted }) => lessonsCompleted >= 10,
  },
  {
    id: 'understood-a-conversation',
    tier: TIERS.DEPTH,
    icon: 'headphones',
    title: 'Understood a conversation',
    body: 'You listened to two people talking and wrote back about what they said. That is comprehension, not recall.',
    earned: ({ comprehensionTasks }) => comprehensionTasks >= 1,
  },
  {
    id: 'passed-a-checkpoint',
    tier: TIERS.DEPTH,
    icon: 'badgeCheck',
    title: 'Passed a checkpoint',
    body: 'You were assessed mid-course and carried on. Your level moves with you now.',
    earned: ({ checkpointsPassed }) => checkpointsPassed >= 1,
  },
  {
    id: 'finished-a-course',
    tier: TIERS.DEPTH,
    icon: 'certificate',
    title: 'Finished a course',
    body: 'Start to finish, with a certificate to show for it.',
    earned: ({ coursesFinished }) => coursesFinished >= 1,
  },
  {
    id: 'moved-up',
    tier: TIERS.DEPTH,
    icon: 'sparkles',
    title: 'Moved up a level',
    body: 'You retook the test and placed higher than before. This is the one that is genuinely hard to fake.',
    earned: ({ attempts }) =>
      attempts.some((a) => a.previousLevel && levelRank(a.level) > levelRank(a.previousLevel)),
  },
  {
    id: 'second-language',
    tier: TIERS.DEPTH,
    icon: 'globe',
    title: 'Placed in a second language',
    body: 'Two languages under way. The second is always faster than the first.',
    earned: ({ placedLanguageCount }) => placedLanguageCount >= 2,
  },
  {
    id: 'seven-days',
    tier: TIERS.PRACTICE,
    icon: 'calendar',
    title: 'Practised on seven days',
    body: 'Seven separate days of practice — not in a row, just seven. Consistency beats intensity.',
    earned: ({ activeDays }) => activeDays >= 7,
  },
];

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const levelRank = (code) => ORDER.indexOf(code);

/**
 * Fold the learner's existing state into the small set of numbers the milestones ask about.
 *
 * `progress` and `curriculumFor` are passed in rather than imported so this stays pure and
 * testable, and so a caller that does not care about courses can omit them entirely.
 */
export function profileFrom({ history = [], levels = {}, progress = {}, curriculumFor = null }) {
  let lessonsCompleted = 0;
  let coursesFinished = 0;
  let checkpointsPassed = 0;
  let comprehensionTasks = 0;

  for (const entry of Object.values(progress)) {
    const lessons = Object.values(entry.lessons ?? {});
    const done = lessons.filter((l) => l.status === 'complete');
    lessonsCompleted += done.length;
    checkpointsPassed += Object.keys(entry.checkpoints ?? {}).length;

    // A comprehension task is a written answer about something the learner listened to.
    // Counting it needs the curriculum, so callers without it simply score zero here
    // rather than guessing.
    if (curriculumFor) {
      const curriculum = curriculumFor(entry.courseId) ?? [];
      comprehensionTasks += curriculum.filter(
        (lesson) =>
          lesson.quiz?.basis === 'conversation' &&
          entry.lessons?.[lesson.id]?.status === 'complete',
      ).length;

      if (curriculum.length && done.length >= curriculum.length) coursesFinished += 1;
    }
  }

  return {
    attempts: history,
    levels,
    placedLanguageCount: Object.keys(levels).length,
    lessonsCompleted,
    coursesFinished,
    checkpointsPassed,
    comprehensionTasks,
    activeDays: activeDaysFrom({ history, progress }),
  };
}

/**
 * Distinct calendar days with any activity on them.
 *
 * Deliberately a count of days rather than a consecutive run. A learner who practises
 * Monday, Thursday and Sunday has practised three days, and telling them their "streak is
 * 1" is both true and useless. Counting total days rewards the same behaviour without
 * ever handing them a number that goes down.
 */
export function activeDaysFrom({ history = [], progress = {} }) {
  const days = new Set();
  const add = (iso) => {
    if (typeof iso === 'string' && iso.length >= 10) days.add(iso.slice(0, 10));
  };

  history.forEach((attempt) => add(attempt.takenAt));

  for (const entry of Object.values(progress)) {
    add(entry.enrolledAt);
    Object.values(entry.lessons ?? {}).forEach((lesson) => add(lesson.completedAt));
    Object.values(entry.checkpoints ?? {}).forEach((checkpoint) => add(checkpoint.takenAt));
  }

  return days.size;
}

/** Every milestone, split into earned and not, in a stable order. */
export function evaluateMilestones(profile) {
  const earned = [];
  const locked = [];
  for (const milestone of MILESTONES) {
    let hit = false;
    try {
      hit = Boolean(milestone.earned(profile));
    } catch {
      // A malformed profile must never break a dashboard over a badge.
      hit = false;
    }
    (hit ? earned : locked).push(milestone);
  }
  return { earned, locked, total: MILESTONES.length };
}

/**
 * What to celebrate right now, given what was just earned.
 *
 * Returns at most one: a wall of badges the instant a test ends is noise, and the point of
 * the moment is a single clear "you did that".
 */
export function newestMilestone(profile) {
  const { earned } = evaluateMilestones(profile);
  return earned.length ? earned[earned.length - 1] : null;
}
