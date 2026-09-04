/**
 * Rules governing when a lesson room may be entered, and by whom.
 *
 * These are pure so the browser and the server can run the identical checks. The browser
 * runs them to decide what to show; the server runs them to decide what to allow. Only
 * the server's answer counts — the client copy exists so a learner sees a countdown
 * instead of an error.
 */

/** A room opens this long before the scheduled start. */
export const JOIN_OPENS_BEFORE_MIN = 10;

/** And stays open this long past the scheduled end, for overruns. */
export const JOIN_CLOSES_AFTER_MIN = 15;

export const MEETING_ROLES = { HOST: 'host', GUEST: 'guest' };

export const JOIN_STATE = {
  TOO_EARLY: 'too_early',
  OPEN: 'open',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  NOT_A_PARTICIPANT: 'not_a_participant',
};

/**
 * Can this user enter this booking's room right now?
 * Returns a state plus the milliseconds until the window opens, for the countdown.
 */
export function evaluateJoinWindow({ booking, userId, now = Date.now() }) {
  if (!booking) {
    return { state: JOIN_STATE.NOT_A_PARTICIPANT, msUntilOpen: 0 };
  }

  const isLearner = booking.learnerId === userId;
  const isTeacher = booking.teacherId === userId;
  if (!isLearner && !isTeacher) {
    return { state: JOIN_STATE.NOT_A_PARTICIPANT, msUntilOpen: 0 };
  }

  if (booking.status === 'cancelled') {
    return { state: JOIN_STATE.CANCELLED, msUntilOpen: 0, role: null };
  }

  const role = isTeacher ? MEETING_ROLES.HOST : MEETING_ROLES.GUEST;
  const opensAt = new Date(booking.startsAt).getTime() - JOIN_OPENS_BEFORE_MIN * 60000;
  const closesAt = new Date(booking.endsAt).getTime() + JOIN_CLOSES_AFTER_MIN * 60000;

  if (now < opensAt) {
    return { state: JOIN_STATE.TOO_EARLY, msUntilOpen: opensAt - now, opensAt, role };
  }
  if (now > closesAt) {
    return { state: JOIN_STATE.EXPIRED, msUntilOpen: 0, closesAt, role };
  }
  return { state: JOIN_STATE.OPEN, msUntilOpen: 0, opensAt, closesAt, role };
}

/** When the issued token should stop working. */
export const tokenExpiryFor = (booking) =>
  Math.floor((new Date(booking.endsAt).getTime() + JOIN_CLOSES_AFTER_MIN * 60000) / 1000);

/** "in 3 hours", "in 12 minutes", "in 45 seconds" */
export function formatCountdown(ms) {
  if (ms <= 0) return 'now';
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes >= 1440) {
    const days = Math.round(totalMinutes / 1440);
    return `in ${days} day${days === 1 ? '' : 's'}`;
  }
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes ? `in ${hours}h ${minutes}m` : `in ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  if (totalMinutes >= 1) return `in ${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
  return `in ${Math.max(1, Math.round(ms / 1000))} seconds`;
}
