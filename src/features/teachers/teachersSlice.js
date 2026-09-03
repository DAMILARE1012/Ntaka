import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  q: '',
  languageId: '',
  countryId: '',
  level: '',
  type: '',
  tags: [],
  maxPrice: null,
  minRating: 0,
  availableWithin72h: false,
  instantLesson: false,
  sort: 'recommended',
  page: 1,
  pageSize: 8,
};

/** Any change other than paging sends the learner back to page 1. */
const resetPage = (state) => {
  state.page = 1;
};

const teachersSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setQuery(state, { payload }) {
      state.q = payload;
      resetPage(state);
    },
    setFilter(state, { payload: { key, value } }) {
      state[key] = value;
      resetPage(state);
    },
    toggleTag(state, { payload }) {
      state.tags = state.tags.includes(payload)
        ? state.tags.filter((t) => t !== payload)
        : [...state.tags, payload];
      resetPage(state);
    },
    setSort(state, { payload }) {
      state.sort = payload;
      resetPage(state);
    },
    setPage(state, { payload }) {
      state.page = payload;
    },
    clearFilters(state) {
      return { ...initialState, q: state.q, languageId: state.languageId };
    },
    resetAll: () => initialState,
  },
});

export const { setQuery, setFilter, toggleTag, setSort, setPage, clearFilters, resetAll } =
  teachersSlice.actions;

export const selectTeacherFilters = (state) => state.teachers;

/** Count of filters the learner has actively applied — drives the "Clear (n)" button. */
export const selectActiveFilterCount = (state) => {
  const f = state.teachers;
  return (
    (f.level ? 1 : 0) +
    (f.type ? 1 : 0) +
    f.tags.length +
    (f.maxPrice != null ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.availableWithin72h ? 1 : 0) +
    (f.instantLesson ? 1 : 0) +
    (f.countryId ? 1 : 0)
  );
};

export default teachersSlice.reducer;
