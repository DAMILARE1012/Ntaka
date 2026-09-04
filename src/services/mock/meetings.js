import { evaluateJoinWindow, tokenExpiryFor, JOIN_STATE } from '@/lib/meetings';
import { readBooking } from '@/services/mock/scheduling';

/**
 * Stand-in for POST /join-lesson.
 *
 * This deliberately runs the *same* authorisation code as the real handler in
 * server/join-lesson.js — both import `evaluateJoinWindow` from lib/meetings.js. The
 * checks are the product; the Daily token is just what you get once they pass. So the
 * behaviour you see now is the behaviour you get with real credentials, and the swap
 * is a transport change, not a logic change.
 *
 * What it cannot fake: an actual room. Without DAILY_API_KEY there is nothing to
 * connect to, so it returns `provider: 'mock'` and the UI renders a stand-in call frame
 * rather than pretending a connection exists.
 */

/** bookingId -> { roomName, roomUrl, createdAt } */
const sessions = new Map();

/** bookingId -> [{ userId, role, joinedAt, leftAt }] */
const participants = new Map();

const randomId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export function joinLesson({ bookingId, user }) {
  if (!user?.id) {
    return { error: 'Sign in to join a lesson.', status: 401 };
  }

  const booking = readBooking(bookingId);
  const verdict = evaluateJoinWindow({ booking, userId: user.id });

  if (verdict.state !== JOIN_STATE.OPEN) {
    const messages = {
      [JOIN_STATE.NOT_A_PARTICIPANT]: 'This lesson is not yours.',
      [JOIN_STATE.CANCELLED]: 'This lesson was cancelled.',
      [JOIN_STATE.TOO_EARLY]: 'The room is not open yet.',
      [JOIN_STATE.EXPIRED]: 'This lesson has ended.',
    };
    return {
      error: messages[verdict.state] ?? 'You cannot join this lesson.',
      state: verdict.state,
      opensAt: verdict.opensAt,
      status: 403,
    };
  }

  // Room name is random and unrelated to the booking id, exactly as in production.
  if (!sessions.has(bookingId)) {
    const roomName = `ntaka-${randomId()}`;
    sessions.set(bookingId, {
      roomName,
      roomUrl: `https://mock.daily.invalid/${roomName}`,
      createdAt: new Date().toISOString(),
    });
  }
  const session = sessions.get(bookingId);

  const attendance = participants.get(bookingId) ?? [];
  if (!attendance.some((p) => p.userId === user.id && !p.leftAt)) {
    attendance.push({ userId: user.id, role: verdict.role, joinedAt: new Date().toISOString() });
    participants.set(bookingId, attendance);
  }

  return {
    data: {
      provider: 'mock',
      bookingId,
      roomUrl: session.roomUrl,
      roomName: session.roomName,
      // A real token is opaque; this one is obviously not, so nobody mistakes it for one.
      token: `mock-token.${user.id}.${verdict.role}`,
      role: verdict.role,
      expiresAt: new Date(tokenExpiryFor(booking) * 1000).toISOString(),
      counterpart:
        booking.learnerId === user.id ? booking.teacherName : booking.learnerName,
      lessonLabel: booking.lessonLabel,
      languageName: booking.languageName,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      durationMin: booking.durationMin,
    },
  };
}

export function leaveLesson({ bookingId, userId }) {
  const attendance = participants.get(bookingId) ?? [];
  const open = attendance.find((p) => p.userId === userId && !p.leftAt);
  if (open) open.leftAt = new Date().toISOString();
  return { data: true };
}

/** Attendance is the evidence behind no-show disputes; it outlives the call. */
export const listParticipants = (bookingId) => participants.get(bookingId) ?? [];
