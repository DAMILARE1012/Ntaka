import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsSignedIn, selectUser } from '@/dashboard/auth/authSlice';
import { selectLevelFor } from '@/features/learner/learnerSlice';
import { ROLES } from '@/services/mock/accounts';

/**
 * The one place that decides whether someone may start learning.
 *
 * Ntaka's rule: nobody learns before they are placed. Not a nudge, not a default — a
 * learner cannot book a lesson, reserve a class seat or open a course until they have
 * taken the free placement test in that language.
 *
 * It is per language, deliberately: a B2 in Yorùbá is an A1 in Igbo, and pretending
 * otherwise would put them in the wrong room on day one.
 *
 * Browsing stays open. Someone has to be able to see teachers, classes and courses to
 * decide what to learn — the gate sits on the action, not on the catalogue.
 *
 * Everything below is UI convenience. When a real backend exists the same check must be
 * repeated server-side on booking, enrolment and lesson-token issue, because anyone can
 * edit client state.
 */
export function usePlacementGate(languageId) {
  const location = useLocation();
  const isSignedIn = useAppSelector(selectIsSignedIn);
  const user = useAppSelector(selectUser);
  const level = useAppSelector(selectLevelFor(languageId));

  // Teachers and admins are not learners; the gate is not theirs.
  const isLearner = user?.role === ROLES.LEARNER;

  const returnTo = `${location.pathname}${location.search}`;

  return {
    /** Signed in, a learner, and not yet placed in this language. */
    required: Boolean(isSignedIn && isLearner && languageId && !level),
    /** Not signed in at all - sign-in comes first, then the test. */
    needsSignIn: !isSignedIn,
    isLearner,
    level: level ?? null,
    /** Where to send them, carrying the language and the way back. */
    testPath: `/dashboard/placement?language=${languageId}&returnTo=${encodeURIComponent(returnTo)}`,
    returnTo,
  };
}
