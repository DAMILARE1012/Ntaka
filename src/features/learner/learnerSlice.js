import { createSlice, isAnyOf } from '@reduxjs/toolkit';

const STORAGE_KEY = 'ntaka.learner.v1';

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState = loadState() ?? {
  /** Placement outcome per language: { [languageId]: { level, takenAt, mode } } */
  levels: {},
  savedTeacherIds: [],
  savedCourseIds: [],
  /** The language the learner is currently focused on, used to personalise the homepage. */
  focusLanguageId: '',
};

const learnerSlice = createSlice({
  name: 'learner',
  initialState,
  reducers: {
    recordPlacement(state, { payload: { languageId, level, mode } }) {
      state.levels[languageId] = { level, mode, takenAt: new Date().toISOString() };
      state.focusLanguageId = languageId;
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
    clearLearner: () => ({ levels: {}, savedTeacherIds: [], savedCourseIds: [], focusLanguageId: '' }),
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

/** Mirrors learner state into localStorage so a refresh keeps the placement result. */
export const learnerPersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (persistOn(action)) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().learner));
    } catch {
      /* storage unavailable (private mode) — state simply is not persisted */
    }
  }
  return result;
};

export default learnerSlice.reducer;
