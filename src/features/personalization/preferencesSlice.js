import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import {
  DEFAULTS,
  PRESETS,
  STORAGE_KEY,
  applyPreferences,
  loadPreferences,
  sanitise,
} from '@/features/personalization/preferences';

/**
 * Reading preferences in the store.
 *
 * Stored against the device, not the account — see the note in preferences.js. That means
 * one plain key, no per-user namespacing, and no interaction with sign-in at all: the
 * preferences a reader set before logging in are still theirs afterwards.
 */
const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: loadPreferences(),
  reducers: {
    preferenceSet(state, { payload: { key, value } }) {
      if (key in DEFAULTS) state[key] = value;
    },
    presetApplied(state, { payload: presetId }) {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return state;
      // A preset starts from the defaults rather than layering onto whatever was set,
      // so applying one twice is the same as applying it once and there is no way to
      // accumulate a combination the reader never chose.
      return sanitise({ ...DEFAULTS, ...preset.values });
    },
    preferencesReset: () => ({ ...DEFAULTS }),
  },
});

export const { preferenceSet, presetApplied, preferencesReset } = preferencesSlice.actions;

export const selectPreferences = (state) => state.preferences;
export const selectPreference = (key) => (state) => state.preferences[key];

const persistOn = isAnyOf(preferenceSet, presetApplied, preferencesReset);

/**
 * Writes to storage and to the DOM in one place.
 *
 * Doing both here rather than in an effect means the attributes are set in the same tick
 * as the state change — no frame where the checkbox has moved but the page has not.
 */
export const preferencesPersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (persistOn(action)) {
    const prefs = store.getState().preferences;
    applyPreferences(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* storage blocked — preferences apply for this visit only */
    }
  }
  return result;
};

export default preferencesSlice.reducer;
