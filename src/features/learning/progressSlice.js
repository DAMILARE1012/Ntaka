import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { restoreSession, sessionStarted, sessionEnded } from '@/dashboard/auth/authSlice';

const STORAGE_PREFIX = 'ntaka.progress.v1';

/** Pre-namespacing key. Unattributable to a user, so dropped rather than migrated. */
const LEGACY_KEY = 'ntaka.progress.v1';

const keyFor = (userId) => `${STORAGE_PREFIX}:${userId}`;

/**
 * Course progress.
 *
 * Kept client-side and persisted to localStorage while there is no backend. The shape
 * mirrors the `course_progress` table it will become — one row per learner per lesson —
 * so moving it is an endpoint swap, not a redesign.
 *
 * Progress is per lesson rather than a single percentage because "you are 60% through"
 * is useless when a learner returns after two weeks. They need to know *which* lesson
 * they were on, and which quizzes they have already passed.
 *
 * Scoped per user for the same reason placement results are: what someone has studied,
 * and what they scored on the way through, is theirs. One unscoped key would hand it to
 * whoever signs in next on a shared computer. See learnerSlice for the full argument.
 */
const blank = () => ({
  /** courseId -> { enrolledAt, lastLessonId, lessons: { [lessonId]: {...} } } */
  courses: {},
});

function loadFor(userId) {
  if (!userId) return blank();
  try {
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch {
    return blank();
  }
}

const initialState = loadFor(restoreSession()?.user?.id);

const emptyCourse = (courseId) => ({
  courseId,
  enrolledAt: new Date().toISOString(),
  lastLessonId: null,
  lessons: {},
  checkpoints: {},
});

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    enrol(state, { payload: courseId }) {
      state.courses[courseId] ??= emptyCourse(courseId);
    },

    openLesson(state, { payload: { courseId, lessonId } }) {
      const course = (state.courses[courseId] ??= emptyCourse(courseId));
      course.lastLessonId = lessonId;
      course.lessons[lessonId] ??= { status: 'in_progress', startedAt: new Date().toISOString() };
    },

    /**
     * Mark a lesson done. `result` carries whatever the lesson produced - a quiz score,
     * a game time, the learner's writing - so a teacher can see the work, not just a tick.
     */
    completeLesson(state, { payload: { courseId, lessonId, result = null } }) {
      const course = (state.courses[courseId] ??= emptyCourse(courseId));
      const existing = course.lessons[lessonId] ?? {};
      course.lessons[lessonId] = {
        ...existing,
        status: 'complete',
        completedAt: new Date().toISOString(),
        // Keep the best attempt, not the latest: retrying should never lose a good score.
        result:
          result?.score != null && existing.result?.score != null
            ? result.score >= existing.result.score
              ? result
              : existing.result
            : (result ?? existing.result ?? null),
        attempts: (existing.attempts ?? 0) + 1,
      };
    },

    recordCheckpoint(state, { payload: { courseId, checkpointId, correct, total, level } }) {
      const course = (state.courses[courseId] ??= emptyCourse(courseId));
      course.checkpoints[checkpointId] = {
        correct,
        total,
        level,
        takenAt: new Date().toISOString(),
      };
    },

    resetCourse(state, { payload: courseId }) {
      delete state.courses[courseId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sessionStarted, (_state, { payload }) => loadFor(payload?.user?.id))
      .addCase(sessionEnded, () => blank());
  },
});

export const { enrol, openLesson, completeLesson, recordCheckpoint, resetCourse } =
  progressSlice.actions;

export const selectCourseProgress = (courseId) => (state) =>
  state.progress.courses[courseId] ?? null;
export const selectIsEnrolled = (courseId) => (state) =>
  Boolean(state.progress.courses[courseId]);
export const selectAllProgress = (state) => state.progress.courses;

export const progressPersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (
    isAnyOf(enrol, openLesson, completeLesson, recordCheckpoint, resetCourse)(action)
  ) {
    // Nothing is written while signed out - courses require an account to begin with.
    const userId = store.getState().auth?.user?.id;
    if (!userId) return result;
    try {
      localStorage.setItem(keyFor(userId), JSON.stringify(store.getState().progress));
    } catch {
      /* storage blocked - progress simply will not survive a refresh */
    }
  }
  return result;
};

export default progressSlice.reducer;
