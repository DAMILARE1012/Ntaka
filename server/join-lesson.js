/**
 * POST /join-lesson   { bookingId }  ->  { roomUrl, token, expiresAt, role }
 *
 * The only place a lesson room or a join token is ever created.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  WHY THIS IS SERVER-SIDE, AND MUST STAY THAT WAY
 * ─────────────────────────────────────────────────────────────────────────────
 *  DAILY_API_KEY is an account-level credential. Anyone holding it can create and
 *  delete rooms, read recordings, and run up your bill. It must never reach the
 *  browser — not in a bundle, not in a VITE_ variable, not in a comment. Vite
 *  inlines every VITE_-prefixed variable into public JavaScript, so naming it
 *  VITE_DAILY_API_KEY would publish it to every visitor.
 *
 *  Three rules this file exists to enforce:
 *
 *  1. The room name is a random UUID, never derived from the booking id.
 *     Derived names are guessable, and a guessable room is an open door.
 *  2. The role comes from the database, never from the request body. Otherwise a
 *     learner claims `is_owner` and can mute or eject their own teacher.
 *  3. The time window is checked here. The client checks it too, but only to show
 *     a countdown — a client check is a courtesy, not a control.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  DEPLOYING
 * ─────────────────────────────────────────────────────────────────────────────
 *  As a Supabase Edge Function:
 *      supabase secrets set DAILY_API_KEY=...
 *      supabase functions deploy join-lesson
 *
 *  Anywhere else (Vercel / Netlify / Express): set DAILY_API_KEY in the server
 *  environment and mount `handleJoinLesson` behind your auth middleware.
 *
 *  `loadBooking` and `recordParticipant` are injected so this file has no database
 *  dependency and can be tested with fakes.
 */

import {
  evaluateJoinWindow,
  tokenExpiryFor,
  JOIN_STATE,
  MEETING_ROLES,
  JOIN_CLOSES_AFTER_MIN,
} from '../src/lib/meetings.js';

const DAILY_API = 'https://api.daily.co/v1';

/** Map a refusal to an HTTP status and a sentence a learner can act on. */
const REFUSALS = {
  [JOIN_STATE.NOT_A_PARTICIPANT]: [403, 'This lesson is not yours.'],
  [JOIN_STATE.CANCELLED]: [409, 'This lesson was cancelled.'],
  [JOIN_STATE.TOO_EARLY]: [425, 'The room is not open yet.'],
  [JOIN_STATE.EXPIRED]: [410, 'This lesson has ended.'],
};

async function daily(path, { method = 'GET', body, apiKey } = {}) {
  const response = await fetch(`${DAILY_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Daily ${method} ${path} failed (${response.status}): ${detail}`);
  }
  return response.json();
}

/**
 * Create the room if this is the first person to arrive.
 *
 * `exp` makes Daily delete the room by itself, so an abandoned lesson cannot be
 * rejoined tomorrow. `eject_at_room_exp` removes anyone still inside at that moment.
 */
async function ensureRoom({ booking, apiKey, enableRecording }) {
  if (booking.meetingRoomName) {
    return { name: booking.meetingRoomName, url: booking.meetingRoomUrl };
  }

  // Random, unguessable, and unrelated to any id a learner can see.
  const name = `ntaka-${crypto.randomUUID()}`;
  const expiry = Math.floor(
    (new Date(booking.endsAt).getTime() + JOIN_CLOSES_AFTER_MIN * 60000) / 1000,
  );

  const room = await daily('/rooms', {
    method: 'POST',
    apiKey,
    body: {
      name,
      privacy: 'private',
      properties: {
        exp: expiry,
        eject_at_room_exp: true,
        // Two people in a 1-on-1 stay peer-to-peer, which is cheaper and lower latency.
        max_participants: 4,
        enable_chat: true,
        enable_screenshare: true,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
        ...(enableRecording ? { enable_recording: 'cloud' } : {}),
      },
    },
  });

  return { name: room.name, url: room.url };
}

/**
 * Mint a token scoped to one person, one room, one lesson.
 * Everything in here is derived server-side. Nothing is taken from the request.
 */
async function mintToken({ booking, room, user, role, apiKey }) {
  const { token } = await daily('/meeting-tokens', {
    method: 'POST',
    apiKey,
    body: {
      properties: {
        room_name: room.name,
        user_name: user.displayName,
        user_id: user.id,
        // The teacher hosts: they can mute, eject and end the call.
        is_owner: role === MEETING_ROLES.HOST,
        exp: tokenExpiryFor(booking),
        // Do not let a token issued for one lesson open a different room.
        enable_screenshare: true,
        start_cloud_recording: false,
      },
    },
  });
  return token;
}

/**
 * @param {object}   deps
 * @param {Function} deps.loadBooking        (bookingId) => booking | null
 * @param {Function} deps.saveRoom           (bookingId, {name, url}) => void
 * @param {Function} deps.recordParticipant  ({bookingId, userId, role}) => void
 * @param {string}   deps.apiKey             DAILY_API_KEY, from the server environment
 * @param {boolean}  deps.enableRecording
 */
export function createJoinLessonHandler({
  loadBooking,
  saveRoom,
  recordParticipant,
  apiKey,
  enableRecording = false,
}) {
  return async function handleJoinLesson({ bookingId, user }) {
    if (!apiKey) {
      return { status: 500, error: 'Video is not configured on this server.' };
    }
    if (!user?.id) {
      return { status: 401, error: 'Sign in to join a lesson.' };
    }

    const booking = await loadBooking(bookingId);

    // Authorisation, time window and participation, all from stored state.
    const verdict = evaluateJoinWindow({ booking, userId: user.id });
    if (verdict.state !== JOIN_STATE.OPEN) {
      const [status, message] = REFUSALS[verdict.state] ?? [403, 'You cannot join this lesson.'];
      return { status, error: message, state: verdict.state, opensAt: verdict.opensAt };
    }

    const room = await ensureRoom({ booking, apiKey, enableRecording });
    if (!booking.meetingRoomName) {
      await saveRoom(bookingId, room);
    }

    const token = await mintToken({ booking, room, user, role: verdict.role, apiKey });

    // Attendance. This is the evidence behind no-show disputes and refunds, so it is
    // written when the token is issued rather than when the browser says it joined.
    await recordParticipant({ bookingId, userId: user.id, role: verdict.role });

    return {
      status: 200,
      data: {
        provider: 'daily',
        roomUrl: room.url,
        token,
        role: verdict.role,
        expiresAt: new Date(tokenExpiryFor(booking) * 1000).toISOString(),
      },
    };
  };
}

/* -------------------------------------------------------------------------- */
/* Supabase Edge Function entry point. Uncomment when deploying there.         */
/* -------------------------------------------------------------------------- */
//
// Deno.serve(async (req) => {
//   const { bookingId } = await req.json();
//   const user = await getUserFromAuthHeader(req);   // supabase.auth.getUser(jwt)
//
//   const handler = createJoinLessonHandler({
//     apiKey: Deno.env.get('DAILY_API_KEY'),
//     loadBooking: (id) => db.from('bookings').select('*').eq('id', id).single(),
//     saveRoom: (id, room) =>
//       db.from('bookings')
//         .update({ meeting_room_name: room.name, meeting_room_url: room.url })
//         .eq('id', id),
//     recordParticipant: ({ bookingId, userId, role }) =>
//       db.from('meeting_participants').insert({ booking_id: bookingId, user_id: userId, role }),
//   });
//
//   const result = await handler({ bookingId, user });
//   return new Response(JSON.stringify(result.data ?? { error: result.error }), {
//     status: result.status,
//     headers: { 'Content-Type': 'application/json' },
//   });
// });
