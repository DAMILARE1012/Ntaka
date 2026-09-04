import { createSlice } from '@reduxjs/toolkit';
import { ROLES } from '@/services/mock/accounts';

const STORAGE_KEY = 'ntaka.session.v1';

/**
 * Session state for the authenticated app.
 *
 * The session is mirrored to localStorage so a refresh does not throw the user out.
 * That is a convenience, never a security boundary: the real check happens server-side
 * on every request. A tampered localStorage entry gets you a dashboard shell and
 * nothing else, because no data comes from it.
 */
function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.expiresAt || session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

const restored = restore();

const initialState = {
  session: restored,
  user: restored?.user ?? null,
  /** Where to send the user once they authenticate. */
  redirectTo: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(state, { payload }) {
      state.session = payload;
      state.user = payload?.user ?? null;
    },
    sessionEnded(state) {
      state.session = null;
      state.user = null;
      state.redirectTo = null;
    },
    redirectRequested(state, { payload }) {
      state.redirectTo = payload;
    },
    redirectConsumed(state) {
      state.redirectTo = null;
    },
  },
});

export const { sessionStarted, sessionEnded, redirectRequested, redirectConsumed } =
  authSlice.actions;

export const selectSession = (state) => state.auth.session;
export const selectUser = (state) => state.auth.user;
export const selectIsSignedIn = (state) => Boolean(state.auth.session);
export const selectRole = (state) => state.auth.user?.role ?? null;
export const selectRedirectTo = (state) => state.auth.redirectTo;

export const selectIsTeacher = (state) => state.auth.user?.role === ROLES.TEACHER;
export const selectIsAdmin = (state) => state.auth.user?.role === ROLES.ADMIN;

/** Keeps localStorage in step with the session. */
export const sessionPersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (action.type === sessionStarted.type || action.type === sessionEnded.type) {
    try {
      const { session } = store.getState().auth;
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage blocked - the session simply will not survive a refresh */
    }
  }
  return result;
};

export default authSlice.reducer;
