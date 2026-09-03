import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'ntaka.theme';

/** Read whatever the pre-paint script in index.html already settled on. */
function initialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* no DOM or no storage — nothing to persist */
    }
  }
  return result;
};

export default themeSlice.reducer;
