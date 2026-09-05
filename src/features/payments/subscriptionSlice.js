import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { restoreSession, sessionStarted, sessionEnded } from '@/dashboard/auth/authSlice';
import { SUBSCRIPTION_STATUS, hasAccess, daysRemaining } from '@/lib/payments';

/**
 * The learner's subscription, mirrored client-side.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THIS IS A CACHE, NOT A SOURCE OF TRUTH
 * ─────────────────────────────────────────────────────────────────────────────
 *  Everything here exists so the UI can render without a round trip. It decides what a
 *  page LOOKS like, never what a learner is entitled to. The real check is server-side,
 *  against what Paystack said — see server/paystack.js. Someone editing localStorage
 *  gets a dashboard that says "subscribed" and no content they were not already owed,
 *  because the content will come from an endpoint that checks properly.
 *
 *  Scoped per user, same as placement results and course progress: one unscoped key would
 *  hand the next person at a shared computer a subscription they did not buy.
 */

const STORAGE_PREFIX = 'ntaka.subscription.v1';
const keyFor = (userId) => `${STORAGE_PREFIX}:${userId}`;

const blank = () => ({
  /** null until we have heard from the server at least once. */
  subscription: null,
  /** Last few payments, for the billing page. Newest first. */
  payments: [],
  /** Reference of a checkout in flight, so a returning learner can be verified. */
  pendingReference: null,
});

function loadFor(userId) {
  if (!userId) return blank();
  try {
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? { ...blank(), ...JSON.parse(raw) } : blank();
  } catch {
    return blank();
  }
}

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: loadFor(restoreSession()?.user?.id),
  reducers: {
    checkoutStarted(state, { payload }) {
      state.pendingReference = payload ?? null;
    },
    checkoutSettled(state) {
      state.pendingReference = null;
    },
    subscriptionLoaded(state, { payload }) {
      state.subscription = payload ?? null;
    },
    paymentRecorded(state, { payload }) {
      state.payments = [payload, ...state.payments.filter((p) => p.reference !== payload.reference)]
        .slice(0, 20);
    },
    /** Local-only optimism for the demo build; the server is still the authority. */
    subscriptionCancelled(state) {
      if (state.subscription) state.subscription.status = SUBSCRIPTION_STATUS.CANCELLING;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sessionStarted, (_s, { payload }) => loadFor(payload?.user?.id))
      .addCase(sessionEnded, () => blank());
  },
});

export const {
  checkoutStarted,
  checkoutSettled,
  subscriptionLoaded,
  paymentRecorded,
  subscriptionCancelled,
} = subscriptionSlice.actions;

export const selectSubscription = (state) => state.subscription.subscription;
export const selectPayments = (state) => state.subscription.payments ?? [];
export const selectPendingReference = (state) => state.subscription.pendingReference;

/** Does this learner have interactive learning right now? */
export const selectHasSubscription = (state) => hasAccess(state.subscription.subscription);

export const selectDaysRemaining = (state) => daysRemaining(state.subscription.subscription);

const persistOn = isAnyOf(
  checkoutStarted,
  checkoutSettled,
  subscriptionLoaded,
  paymentRecorded,
  subscriptionCancelled,
);

export const subscriptionPersistence = (store) => (next) => (action) => {
  const result = next(action);
  if (persistOn(action)) {
    const userId = store.getState().auth?.user?.id;
    if (!userId) return result;
    try {
      localStorage.setItem(keyFor(userId), JSON.stringify(store.getState().subscription));
    } catch {
      /* storage blocked — state simply is not cached */
    }
  }
  return result;
};

export default subscriptionSlice.reducer;
