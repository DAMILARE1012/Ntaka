/* eslint-disable no-console */
import * as db from '@/services/mock/db';
import * as meetings from '@/services/mock/meetings';
import { TEACHERS } from '@/services/mock/teachers';
import { evaluateJoinWindow, JOIN_STATE, MEETING_ROLES, JOIN_OPENS_BEFORE_MIN } from '@/lib/meetings';
import { createJoinLessonHandler } from '../server/join-lesson.js';

let fails = 0;
const check = (label, ok, extra = '') => {
  console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
  if (!ok) fails += 1;
};

const MIN = 60000;
const fakeBooking = (over = {}) => ({
  id: 'bk-test',
  learnerId: 'user-learner-1',
  teacherId: 'yoruba-1',
  learnerName: 'Chinelo',
  teacherName: 'Adetunde',
  languageName: 'Yoruba',
  lessonLabel: 'Single lesson',
  durationMin: 60,
  status: 'confirmed',
  startsAt: new Date(Date.now() + 60 * MIN).toISOString(),
  endsAt: new Date(Date.now() + 120 * MIN).toISOString(),
  ...over,
});

async function main() {
  console.log('--- the join window (pure rules) ---');
  const soon = fakeBooking();
  check('too early before the window opens',
    evaluateJoinWindow({ booking: soon, userId: 'user-learner-1' }).state === JOIN_STATE.TOO_EARLY);

  const open = fakeBooking({
    startsAt: new Date(Date.now() + 5 * MIN).toISOString(),
    endsAt: new Date(Date.now() + 65 * MIN).toISOString(),
  });
  check('open inside the window',
    evaluateJoinWindow({ booking: open, userId: 'user-learner-1' }).state === JOIN_STATE.OPEN);
  check(`opens exactly ${JOIN_OPENS_BEFORE_MIN} min before the start`,
    evaluateJoinWindow({
      booking: fakeBooking({
        startsAt: new Date(Date.now() + (JOIN_OPENS_BEFORE_MIN - 1) * MIN).toISOString(),
        endsAt: new Date(Date.now() + 70 * MIN).toISOString(),
      }),
      userId: 'user-learner-1',
    }).state === JOIN_STATE.OPEN);

  check('expired after the grace period',
    evaluateJoinWindow({
      booking: fakeBooking({
        startsAt: new Date(Date.now() - 180 * MIN).toISOString(),
        endsAt: new Date(Date.now() - 120 * MIN).toISOString(),
      }),
      userId: 'user-learner-1',
    }).state === JOIN_STATE.EXPIRED);

  check('cancelled lesson refused',
    evaluateJoinWindow({ booking: fakeBooking({ ...open, status: 'cancelled' }), userId: 'user-learner-1' }).state === JOIN_STATE.CANCELLED);

  console.log('');
  console.log('--- who is who ---');
  check('teacher is host',
    evaluateJoinWindow({ booking: open, userId: 'yoruba-1' }).role === MEETING_ROLES.HOST);
  check('learner is guest',
    evaluateJoinWindow({ booking: open, userId: 'user-learner-1' }).role === MEETING_ROLES.GUEST);
  check('A STRANGER IS REFUSED',
    evaluateJoinWindow({ booking: open, userId: 'user-random' }).state === JOIN_STATE.NOT_A_PARTICIPANT);
  check('a stranger gets no role', !evaluateJoinWindow({ booking: open, userId: 'user-random' }).role);

  console.log('');
  console.log('--- the mock service end to end ---');
  const teacher = TEACHERS.find((t) => t.languageId === 'yoruba');
  const learner = { id: 'user-learner-1', displayName: 'Chinelo Adeyemi' };
  const slots = db.listSlots({ teacherId: teacher.id, lessonType: 'standard' });
  const made = db.bookLesson({ learner, teacherId: teacher.id, startsAt: slots.slots[0].startsAt, lessonType: 'standard' });
  check('a booking exists to join', Boolean(made.data));

  const early = db.joinLesson({ bookingId: made.data.id, user: learner });
  check('joining early is refused by the service', Boolean(early.error), early.error);
  check('refusal names the state', early.state === JOIN_STATE.TOO_EARLY);

  console.log('');
  console.log('--- the real server handler, with a stubbed Daily API ---');
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const body = options?.body ? JSON.parse(options.body) : null;
    calls.push({ url: String(url), auth: options?.headers?.Authorization, body });
    if (String(url).endsWith('/rooms')) {
      return { ok: true, json: async () => ({ name: body.name, url: `https://team.daily.co/${body.name}` }) };
    }
    return { ok: true, json: async () => ({ token: 'daily.jwt.value' }) };
  };

  const saved = [];
  const attendance = [];
  const handler = createJoinLessonHandler({
    apiKey: 'test-key-never-in-the-client',
    loadBooking: async () => open,
    saveRoom: async (id, room) => saved.push({ id, room }),
    recordParticipant: async (row) => attendance.push(row),
  });

  const asTeacher = await handler({ bookingId: 'bk-test', user: { id: 'yoruba-1', displayName: 'Adetunde' } });
  check('handler issues a token inside the window', asTeacher.status === 200, asTeacher.error ?? 'ok');
  check('room url returned', asTeacher.data?.roomUrl?.includes('daily.co'));
  check('teacher token is minted as owner',
    calls.find((c) => c.url.endsWith('/meeting-tokens'))?.body?.properties?.is_owner === true);
  check('api key sent only in the Authorization header',
    calls.every((c) => c.auth === 'Bearer test-key-never-in-the-client'));
  check('room name is random, NOT derived from the booking id',
    !saved[0]?.room?.name.includes('bk-test') && saved[0]?.room?.name.startsWith('ntaka-'),
    saved[0]?.room?.name);
  check('room is private', calls[0]?.body?.privacy === 'private');
  check('room self-destructs after the lesson', typeof calls[0]?.body?.properties?.exp === 'number');
  check('attendance recorded at token issue', attendance.length === 1 && attendance[0].role === MEETING_ROLES.HOST);

  const asLearner = await handler({ bookingId: 'bk-test', user: { id: 'user-learner-1', displayName: 'Chinelo' } });
  check('learner also admitted', asLearner.status === 200);
  check('LEARNER TOKEN IS NOT OWNER',
    calls.filter((c) => c.url.endsWith('/meeting-tokens')).pop()?.body?.properties?.is_owner === false);

  const asStranger = await handler({ bookingId: 'bk-test', user: { id: 'user-random', displayName: 'Nobody' } });
  check('STRANGER REFUSED 403 BY THE SERVER', asStranger.status === 403, asStranger.error);
  check('no token minted for the stranger',
    calls.filter((c) => c.url.endsWith('/meeting-tokens')).length === 2);

  const anon = await handler({ bookingId: 'bk-test', user: null });
  check('signed-out refused 401', anon.status === 401);

  const noKey = createJoinLessonHandler({ apiKey: '', loadBooking: async () => open, saveRoom: async () => {}, recordParticipant: async () => {} });
  check('missing api key fails closed, not open', (await noKey({ bookingId: 'bk-test', user: { id: 'yoruba-1' } })).status === 500);

  const cancelledHandler = createJoinLessonHandler({
    apiKey: 'k', loadBooking: async () => ({ ...open, status: 'cancelled' }),
    saveRoom: async () => {}, recordParticipant: async () => {},
  });
  check('cancelled lesson refused 409', (await cancelledHandler({ bookingId: 'x', user: { id: 'yoruba-1' } })).status === 409);

  globalThis.fetch = originalFetch;

  console.log('');
  console.log('--- attendance survives the call ---');
  meetings.leaveLesson({ bookingId: made.data.id, userId: learner.id });
  check('participant list is queryable after leaving', Array.isArray(db.listMeetingParticipants(made.data.id)));

  console.log('');
  console.log(fails ? fails + ' CHECK(S) FAILED' : 'MEETING CHECKS OK');
  if (fails) process.exitCode = 1;
}

main();
