import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { ntakaApi } from '@/services/api';
import teachersReducer from '@/features/teachers/teachersSlice';
import classesReducer from '@/features/classes/classesSlice';
import videosReducer from '@/features/videos/videosSlice';
import placementReducer from '@/features/placement/placementSlice';
import learnerReducer, { learnerPersistence } from '@/features/learner/learnerSlice';
import themeReducer, { themePersistence } from '@/features/theme/themeSlice';

/**
 * `devChecks: false` is for scripts/prerender.jsx, which builds a store per page across
 * hundreds of pages. Redux's serializable/immutable invariants are a development aid;
 * running them 391 times only costs build time.
 */
export const makeStore = ({ devChecks = true } = {}) =>
  configureStore({
    reducer: {
      [ntakaApi.reducerPath]: ntakaApi.reducer,
      teachers: teachersReducer,
      classes: classesReducer,
      videos: videosReducer,
      placement: placementReducer,
      learner: learnerReducer,
      theme: themeReducer,
    },
    middleware: (getDefault) =>
      getDefault(
        devChecks ? undefined : { serializableCheck: false, immutableCheck: false },
      ).concat(ntakaApi.middleware, learnerPersistence, themePersistence),
  });

export const store = makeStore();

setupListeners(store.dispatch);
