import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  q: '',
  languageId: '',
  level: '',
  topic: '',
  maxPrice: null,
  onlyAvailable: true,
  sort: 'soonest',
  page: 1,
  pageSize: 6,
};

const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    setQuery(state, { payload }) {
      state.q = payload;
      state.page = 1;
    },
    setFilter(state, { payload: { key, value } }) {
      state[key] = value;
      state.page = 1;
    },
    setSort(state, { payload }) {
      state.sort = payload;
      state.page = 1;
    },
    setPage(state, { payload }) {
      state.page = payload;
    },
    clearFilters(state) {
      return { ...initialState, q: state.q, languageId: state.languageId };
    },
  },
});

export const { setQuery, setFilter, setSort, setPage, clearFilters } = classesSlice.actions;

export const selectClassFilters = (state) => state.classes;

export const selectActiveClassFilterCount = (state) => {
  const f = state.classes;
  return (f.level ? 1 : 0) + (f.topic ? 1 : 0) + (f.maxPrice != null ? 1 : 0);
};

export default classesSlice.reducer;
