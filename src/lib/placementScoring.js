import { LEVEL_CODES, levelIndex } from '@/lib/cefr';

/**
 * Scoring across the four things the test measures.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHAT IS AND IS NOT MACHINE-SCORED — read this before trusting a number
 * ─────────────────────────────────────────────────────────────────────────────
 *  VOCABULARY   Objectively scored. Multiple choice with one right answer.
 *
 *  WRITING      Partially scored. We can measure length, sentence count, use of the
 *               language's diacritics, and overlap with vocabulary expected at each
 *               level. We CANNOT judge grammar or meaning without a language model or
 *               a human. So writing contributes a capped signal and is flagged for the
 *               first teacher to confirm.
 *
 *  SPEAKING     NOT scored. We capture the audio and measure that a real attempt was
 *               made (duration, both prompts answered). Judging pronunciation, fluency
 *               or tone from a waveform is not something this code can honestly claim.
 *               The recording is attached to the result for a teacher to listen to.
 *
 *  SELF-CHECK   Self-reported. Used to adjust upward when someone clearly understands
 *               far more than they write - the common case for heritage speakers.
 *
 *  The result therefore reports a level AND a confidence, and the UI says which parts
 *  a human still needs to confirm. Reporting a single confident number off a 90-second
 *  recording would be a lie that costs a learner a misplaced first lesson.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Points a correct vocabulary answer is worth, by the level it tests. */
export const LEVEL_POINTS = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export const SKILLS = {
  VOCABULARY: 'vocabulary',
  WRITING: 'writing',
  SPEAKING: 'speaking',
  SELF: 'self',
};

export const CONFIDENCE = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const ratioToLevel = (ratio) => {
  if (ratio >= 0.94) return 'C2';
  if (ratio >= 0.78) return 'C1';
  if (ratio >= 0.58) return 'B2';
  if (ratio >= 0.36) return 'B1';
  if (ratio >= 0.16) return 'A2';
  return 'A1';
};

/* ------------------------------------------------------------------ vocabulary */

export function scoreVocabulary(questions = [], answers = {}) {
  if (!questions.length) return null;

  let score = 0;
  const maxScore = questions.reduce((n, q) => n + LEVEL_POINTS[q.level], 0);

  const breakdown = questions.map((item) => {
    const given = answers[item.id];
    const correct = given === item.answerId;
    if (correct) score += LEVEL_POINTS[item.level];
    return {
      id: item.id,
      level: item.level,
      prompt: item.prompt,
      correct,
      given,
      answerId: item.answerId,
      answerLabel: item.options.find((o) => o.id === item.answerId)?.label,
      note: item.note,
    };
  });

  return {
    skill: SKILLS.VOCABULARY,
    scored: true,
    score,
    maxScore,
    level: ratioToLevel(score / maxScore),
    correctCount: breakdown.filter((b) => b.correct).length,
    total: questions.length,
    breakdown,
  };
}

/* --------------------------------------------------------------------- writing */

const words = (text) => String(text ?? '').trim().split(/\s+/).filter(Boolean);
const sentences = (text) =>
  String(text ?? '')
    .split(/[.!?。]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Signals we can actually measure. Deliberately capped at B1: a paragraph that is long,
 * correctly accented and uses the right vocabulary still tells us nothing about whether
 * the grammar holds up, and claiming C1 off word counts would be dishonest.
 */
export function scoreWriting({ response, prompt, language }) {
  const text = String(response ?? '').trim();
  if (!text) {
    return { skill: SKILLS.WRITING, scored: false, attempted: false, level: null, signals: {} };
  }

  const wordCount = words(text).length;
  const sentenceCount = sentences(text).length;

  // Does the writing carry the marks the language actually uses?
  const diacritics = language?.tonal || /[àáèéìíòóùúẹọṣńǹ̀́̄]/i.test(text)
    ? (text.match(/[̀-ͯ]|[àáâãèéêìíîòóôõùúûẹọṣĩũñ]/gi) ?? []).length
    : 0;

  // Overlap with the vocabulary the prompt expects at this level.
  const expected = (prompt?.expectedWords ?? []).map((w) => w.toLowerCase());
  const lowered = text.toLowerCase();
  const matched = expected.filter((w) => lowered.includes(w));

  const signals = {
    wordCount,
    sentenceCount,
    diacriticCount: diacritics,
    usesDiacritics: diacritics > 0,
    expectedWordsFound: matched.length,
    expectedWordsTotal: expected.length,
  };

  let level = 'A1';
  if (wordCount >= 12 && sentenceCount >= 2) level = 'A2';
  if (wordCount >= 30 && sentenceCount >= 3 && matched.length >= Math.ceil(expected.length / 3)) {
    level = 'B1';
  }

  return {
    skill: SKILLS.WRITING,
    scored: true,
    attempted: true,
    // The ceiling is the honest part: this method cannot see past B1.
    cappedAt: 'B1',
    level,
    signals,
    needsHumanReview: true,
    response: text,
  };
}

/* -------------------------------------------------------------------- speaking */

/**
 * Not a score. A record that an attempt was made, and how substantial it was, so a
 * teacher knows whether there is anything on the recording worth listening to.
 */
export function summariseSpeaking(recordings = []) {
  const attempted = recordings.filter((r) => r?.durationMs > 0);
  const totalMs = attempted.reduce((n, r) => n + r.durationMs, 0);

  return {
    skill: SKILLS.SPEAKING,
    scored: false,
    attempted: attempted.length > 0,
    promptsAnswered: attempted.length,
    promptsTotal: recordings.length,
    totalSeconds: Math.round(totalMs / 1000),
    // Anything under ~8 seconds across both prompts is not enough to assess.
    substantial: totalMs >= 8000,
    needsHumanReview: true,
    recordings: attempted.map((r) => ({ promptId: r.promptId, durationMs: r.durationMs })),
  };
}

/* ------------------------------------------------------------------ self-check */

export function selfAssessedLevel(checked = [], statements = []) {
  let best = null;
  for (const item of statements) {
    if (!checked.includes(item.level)) break;
    best = item.level;
  }
  return best ?? 'A1';
}

/* --------------------------------------------------------------------- combine */

/**
 * Pick the level to place the learner at.
 *
 * Vocabulary leads because it is the only objectively scored part. Writing can pull the
 * result up one step when it clearly outruns the quiz, and the self-check can pull it up
 * one step when someone plainly understands more than they write. Neither can pull it
 * down: a learner who under-performs one section still gets the benefit of the doubt,
 * because a lesson pitched slightly high is recoverable and one pitched low is boring.
 */
export function combine({ vocabulary, writing, speaking, selfLevel }) {
  const base = vocabulary?.level ?? selfLevel ?? 'A1';
  let index = levelIndex(base);
  const reasons = [];

  if (writing?.scored && levelIndex(writing.level) > index) {
    index = Math.min(index + 1, levelIndex(writing.cappedAt));
    reasons.push('Your writing was stronger than the quiz suggested.');
  }

  if (selfLevel && levelIndex(selfLevel) > index + 1) {
    index += 1;
    reasons.push('You report understanding well beyond what the written questions showed.');
  }

  const level = LEVEL_CODES[Math.max(0, Math.min(index, LEVEL_CODES.length - 1))];

  // Confidence reflects how much of the picture was actually measured.
  let confidence = CONFIDENCE.MEDIUM;
  if (vocabulary?.scored && writing?.attempted && speaking?.substantial) {
    confidence = CONFIDENCE.HIGH;
  } else if (!vocabulary?.scored && !writing?.attempted) {
    confidence = CONFIDENCE.LOW;
  }

  return {
    level,
    confidence,
    adjusted: level !== base,
    reasons,
    // Everything a human still has to confirm, stated plainly.
    pendingReview: [
      speaking?.attempted ? 'speaking' : null,
      writing?.attempted ? 'writing' : null,
    ].filter(Boolean),
  };
}
