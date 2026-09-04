import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { restoreSession, sessionStarted, sessionEnded } from '@/dashboard/auth/authSlice';

/**
 * A learner's placement results, history and saved items.
 *
 * This state belongs to one person's profile and to nowhere else. Two rules follow from
 * that, and both are enforced here rather than left to call sites:
 *
 *   1. Storage is namespaced per user. A single unscoped key means that signing out and
 *      signing in as someone else on the same browser hands the second person the first
 *      person's level and full test history. On a shared or family computer — which is
 *      normal for the audience this platform is built for — that is a real disclosure,
 *      not a theoretical one.
 *   2. Nothing is persisted while signed out. Placement requires an account, so there is
 *      no such thing as an anonymous result to keep.
 *
 * Marketing pages must not read this state at all. `scripts/profile-scope-check.js`
 * enforces that; see the comment there for why.
 */

const STORAGE_PREFIX = 'ntaka.learner.v1';

/**
 * The pre-namespacing key. It cannot be attributed to any particular user, so it is
 * removed rather than migrated — guessing whose results those are is exactly the mistake
 * the namespacing exists to prevent.
 */
const LEGACY_KEY = 'ntaka.learner.v1';

const keyFor = (userId) => `${STORAGE_PREFIX}:${userId}`;

const EMPTY = {
  /**
   * Latest placement per language, for the lookups that need one answer fast -
   * the learning gate, teacher filtering, the dashboard.
   */
  levels: {},
  /**
   * Every attempt, newest first. Kept separately because a level is a snapshot and
   * progress is the story: A1 in March, A2 in June, B1 in October is the thing that
   * keeps a learner going, and the evidence a teacher wants before a first lesson.
   */
  history: [],
  savedTeacherIds: [],
  savedCourseIds: [],
  /** The language the learner is currently working on, used to order their dashboard. */
  focusLanguageId: '',
};

const blank = () => structuredClone(EMPTY);

const loadFor = (userId) => {
  if (!userId) return blank();
  try {
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch {
    return blank();
  }
};

const learnerSlice = createSlice({
  name: 'learner',
  initialState: loadFor(restoreSession()?.user?.id),
  reducers: {
    recordPlacement(state, { payload }) {
      const { languageId, languageName, level, mode, confidence, skills, pendingReview } = payload;
      const previous = state.levels[languageId]?.level ?? null;
      const takenAt = new Date().toISOString();

      state.levels[languageId] = { level, mode, confidence, takenAt };
      state.focusLanguageId = languageId;

      state.history.unshift({
        id: `att-${Date.now().toString(36)}`,
        languageId,
        languageName,
        level,
        previousLevel: previous,
        mode,
        confidence,
        takenAt,
        pendingReview: pendingReview ?? [],
        // Only what the history needs - the full result is too big to keep forever
        // in localStorage, and the audio blobs would not survive a reload anyway.
        summary: {
          vocabulary: skills?.vocabulary
            ? { correct: skills.vocabulary.correctCount, total: skills.vocabulary.total }
            : null,
          writing: skills?.writing?.attempted
            ? { words: skills.writing.signals?.wordCount ?? 0, level: skills.writing.level }
            : null,
          speaking: skills?.speaking?.attempted
            ? { seconds: skills.speaking.totalSeconds, prompts: skills.speaking.promptsAnswered }
            : null,
        },
      });

      // Twenty attempts is more history than anyone reads, and localStorage is finite.
      state.history = state.history.slice(0, 20);
    },
    setFocusLanguage(state, { payload }) {
      state.focusLanguageId = payload;
    },
    toggleSavedTeacher(state, { payload }) {
      state.savedTeacherIds = state.savedTeacherIds.includes(payload)
        ? state.savedTeacherIds.filter((id) => id !== payload)
        : [...state.savedTeacherIds, payload];
    },
    toggleSavedCourse(state, { payload }) {
      state.savedCourseIds = state.savedCourseIds.includes(payload)
        ? state.savedCourseIds.filter((id) => id !== payload)
        : [...state.savedCourseIds, payload];
    },
    clearLearner: () => blank(),
  },
  extraReducers: (builder) => {
    builder
      // Signing in swaps in that person's profile - never the one already in memory.
      .addCase(sessionStarted, (_state, { payload }) => loadFor(payload?.user?.id))
      // Signing out empties it. What is on disk stays there, under that user's own key,
      // ready for them and unreadable to whoever signs in next.
      .addCase(sessionEnded, () => blank());
  },
});

export const {
  recordPlacement,
  setFocusLanguage,
  toggleSavedTeacher,
  toggleSavedCourse,
  clearLearner,
} = learnerSlice.actions;

export const selectLearner = (state) => state.learner;
export const selectHistory = (state) => state.learner.history ?? [];
export const selectHistoryFor = (languageId) => (state) =>
  (state.learner.history ?? []).filter((entry) => entry.languageId === languageId);
export const selectLevelFor = (languageId) => (state) => state.learner.levels[languageId]?.level;
export const selectIsTeacherSaved = (id) => (state) => state.learner.savedTeacherIds.includes(id);
export const selectIsCourseSaved = (id) => (state) => state.learner.savedCourseIds.includes(id);

const persistOn = isAnyOf(
  recordPlacement,
  setFocusLanguage,
  toggleSavedTeacher,
  toggleSavedCourse,
  clearLearner,
);

/**
 * Mirrors learner state into that user's own storage key so a refresh keeps their
 * placement result. Writes nothing when signed out: with no profile to attach a result
 * to, keeping one would leave it for the next person at this browser.
 */
export const learnerPersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (persistOn(action)) {
    const userId = store.getState().auth?.user?.id;
    if (!userId) return result;
    try {
      localStorage.setItem(keyFor(userId), JSON.stringify(store.getState().learner));
    } catch {
      /* storage unavailable (private mode) — state simply is not persisted */
    }
  }
  return result;
};

export default learnerSlice.reducer;
