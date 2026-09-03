import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  q: '',
  languageId: '',
  level: '',
  track: '',
  freeOnly: false,
  sort: 'popular',
  page: 1,
  pageSize: 9,
};

const videosSlice = createSlice({
  name: 'videos',
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

export const { setQuery, setFilter, setSort, setPage, clearFilters } = videosSlice.actions;

export const selectVideoFilters = (state) => state.videos;

export const selectActiveVideoFilterCount = (state) => {
  const f = state.videos;
  return (f.level ? 1 : 0) + (f.track ? 1 : 0) + (f.freeOnly ? 1 : 0);
};

export default videosSlice.reducer;
