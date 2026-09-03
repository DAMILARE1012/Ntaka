import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'ntaka.theme';

/**
 * Read whatever the pre-paint script in index.html already settled on.
 * Day mode is the product default: only an explicit choice by this visitor turns on
 * dark. This must stay in step with the script in index.html, or React would correct
 * the theme after paint and cause the flash that script exists to prevent.
 */
function initialMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: initialMode() },
  reducers: {
    setMode(state, { payload }) {
      state.mode = payload;
    },
    toggleMode(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { setMode, toggleMode } = themeSlice.actions;
export const selectThemeMode = (state) => state.theme.mode;

/** Writes the class onto <html> and remembers the choice. */
export const themePersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (action.type === setMode.type || action.type === toggleMode.type) {
    const { mode } = store.getState().theme;
    try {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', mode === 'dark' ? '#081810' : '#F9FBFA');
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* no DOM or no storage — nothing to persist */
    }
  }
  return result;
};

export default themeSlice.reducer;
