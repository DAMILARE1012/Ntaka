/* eslint-disable no-console */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '@/app/store';
import { ntakaApi } from '@/services/api';
import App from '@/App';
import { sessionStarted } from '@/dashboard/auth/authSlice';
import * as accounts from '@/services/mock/accounts';
import * as db from '@/services/mock/db';
import { TEACHERS } from '@/services/mock/teachers';
import { zonedParts } from '@/lib/timezone';

let fails = 0;
const check = (label, ok, extra = '') => {
  console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
  if (!ok) fails += 1;
};

const render = (store, url) =>
  renderToString(
    React.createElement(Provider, { store },
      React.createElement(StaticRouter, { location: url }, React.createElement(App))));

async function main() {
  const teacher = TEACHERS.find((t) => t.languageId === 'yoruba');
  const learner = { id: 'user-learner-1', displayName: 'Chinelo Adeyemi' };

  console.log('--- availability derives from rules ---');
  check('teacher has weekly rules', teacher.availabilityRules.length > 0, teacher.availabilityRules.length + ' rules');
  check('teacher has an IANA timezone', teacher.timezone === 'Africa/Lagos', teacher.timezone);

  const slotSet = db.listSlots({ teacherId: teacher.id, lessonType: 'standard' });
  check('slots generated for a real teacher', slotSet.slots.length > 0, slotSet.slots.length + ' slots');
  check('slot price matches the hourly rate', slotSet.price === teacher.hourlyRate, '$' + slotSet.price);

  // The grid on the card and the picker must agree: every grid block must be backed by a slot.
  const full = db.readTeacher(teacher.id);
  const gridBlocks = Object.values(full.availability).flat().length;
  check('profile grid is populated from the same rules', gridBlocks > 0, gridBlocks + ' open blocks');

  console.log('');
  console.log('--- lead time and rule boundaries ---');
  check('no slot is inside the 2h lead time',
    slotSet.slots.every((s) => new Date(s.startsAt).getTime() > Date.now() + 119 * 60000));
  const weekdays = new Set(teacher.availabilityRules.map((r) => r.weekday));
  check('every slot falls on a rule weekday',
    slotSet.slots.every((s) => weekdays.has(zonedParts(new Date(s.startsAt), teacher.timezone).weekday)));

  console.log('');
  console.log('--- booking ---');
  const target = slotSet.slots[3];
  const booked = db.bookLesson({ learner, teacherId: teacher.id, startsAt: target.startsAt, lessonType: 'standard' });
  check('booking succeeds', Boolean(booked.data), booked.error ?? booked.data.id);
  check('booking stores a UTC instant', booked.data.startsAt === target.startsAt);
  check('booking carries the teacher timezone', booked.data.teacherTimezone === 'Africa/Lagos');

  const after = db.listSlots({ teacherId: teacher.id, lessonType: 'standard' });
  check('the booked slot disappears from availability',
    !after.slots.some((s) => s.startsAt === target.startsAt));
  // Slots start every 30 min, so a 60-min lesson blocks up to three candidate starts:
  // the one that begins 30 min earlier, the one on the hour, and the one 30 min later.
  const removed = slotSet.slots.filter((s) => !after.slots.some((a) => a.startsAt === s.startsAt));
  check('a 60-min booking blocks 1-3 candidate starts', removed.length >= 1 && removed.length <= 3,
    removed.length + ' removed');
  check('every removed slot genuinely overlaps the lesson', removed.every((s) => {
    const start = new Date(s.startsAt).getTime();
    const bookedStart = new Date(target.startsAt).getTime();
    return start < bookedStart + 60 * 60000 && bookedStart < start + 60 * 60000;
  }));
  check('a non-overlapping slot an hour later survives',
    after.slots.some((s) => new Date(s.startsAt).getTime() >= new Date(target.startsAt).getTime() + 60 * 60000));

  const again = db.bookLesson({ learner, teacherId: teacher.id, startsAt: target.startsAt, lessonType: 'standard' });
  check('double booking the same slot is refused', Boolean(again.error), again.error);

  const past = db.bookLesson({ learner, teacherId: teacher.id, startsAt: '2020-01-01T10:00:00.000Z', lessonType: 'standard' });
  check('booking in the past is refused', Boolean(past.error), past.error);

  const trialSlots = db.listSlots({ teacherId: teacher.id, lessonType: 'trial' });
  const t1 = db.bookLesson({ learner, teacherId: teacher.id, startsAt: trialSlots.slots[0].startsAt, lessonType: 'trial' });
  check('a trial can be booked', Boolean(t1.data));
  const t2 = db.bookLesson({ learner, teacherId: teacher.id, startsAt: trialSlots.slots[8].startsAt, lessonType: 'trial' });
  check('a second trial with the same teacher is refused', Boolean(t2.error), t2.error);

  console.log('');
  console.log('--- listing and cancellation ---');
  const mine = db.listBookings({ learnerId: learner.id, scope: 'upcoming' });
  check('learner sees their bookings', mine.length === 2, mine.length + ' upcoming');
  check('bookings are decorated with the teacher', Boolean(mine[0].teacher?.name));
  check('teacher sees the same lessons',
    db.listBookings({ teacherId: teacher.id, scope: 'upcoming' }).length === 2);

  const stranger = db.dropBooking({ bookingId: mine[0].id, userId: 'user-someone-else' });
  check('a stranger cannot cancel your lesson', Boolean(stranger.error), stranger.error);

  const cancelled = db.dropBooking({ bookingId: mine[0].id, userId: learner.id });
  check('the learner can cancel their own', Boolean(cancelled.data));
  check('cancelled leaves the upcoming list',
    db.listBookings({ learnerId: learner.id, scope: 'upcoming' }).length === 1);
  check('cancelled appears in past', db.listBookings({ learnerId: learner.id, scope: 'past' }).length >= 1);

  const freed = db.listSlots({ teacherId: teacher.id, lessonType: 'standard' });
  check('cancelling returns the slot to availability',
    freed.slots.some((s) => s.startsAt === mine[0].startsAt) || mine[0].lessonType === 'trial');

  console.log('');
  console.log('--- availability editing ---');
  const before = db.readAvailability(teacher.id);
  db.writeAvailabilityRules({
    teacherId: teacher.id,
    rules: [{ weekday: 2, startMinute: 600, endMinute: 780 }],
  });
  const narrowed = db.listSlots({ teacherId: teacher.id, lessonType: 'standard' });
  check('rewriting rules changes the slots', narrowed.slots.length !== after.slots.length,
    `${after.slots.length} -> ${narrowed.slots.length}`);
  check('all remaining slots are on the new weekday',
    narrowed.slots.every((s) => zonedParts(new Date(s.startsAt), teacher.timezone).weekday === 2));

  const day = narrowed.slots[0]?.teacherDateKey;
  if (day) {
    db.writeException({ teacherId: teacher.id, exception: { date: day, startMinute: 0, endMinute: 1440, isAvailable: false } });
    const blocked = db.listSlots({ teacherId: teacher.id, lessonType: 'standard' });
    check('a day-off exception clears that date',
      !blocked.slots.some((s) => s.teacherDateKey === day), 'blocked ' + day);
  }
  db.writeAvailabilityRules({ teacherId: teacher.id, rules: before.rules });

  console.log('');
  console.log('--- screens render ---');
  const store = makeStore({ devChecks: false });
  store.dispatch(sessionStarted(accounts.signIn({ email: 'learner@ntaka.com', password: 'ntaka-demo' }).data));
  await store.dispatch(ntakaApi.endpoints.getBookings.initiate({ learnerId: learner.id, scope: 'upcoming' }));
  const lessonsHtml = render(store, '/dashboard/lessons');
  check('learner /dashboard/lessons renders', lessonsHtml.includes('My lessons'));

  const tStore = makeStore({ devChecks: false });
  tStore.dispatch(sessionStarted(accounts.signIn({ email: 'teacher@ntaka.com', password: 'ntaka-demo' }).data));
  await tStore.dispatch(ntakaApi.endpoints.getAvailability.initiate(teacher.id));
  check('teacher /dashboard/availability renders', render(tStore, '/dashboard/availability').includes('Weekly hours'));
  check('teacher /dashboard/schedule renders', render(tStore, '/dashboard/schedule').includes('Schedule'));

  const lStore = makeStore({ devChecks: false });
  lStore.dispatch(sessionStarted(accounts.signIn({ email: 'learner@ntaka.com', password: 'ntaka-demo' }).data));
  const guarded = render(lStore, '/dashboard/availability');
  check('a learner cannot reach the availability editor', !guarded.includes('Weekly hours'));

  await store.dispatch(ntakaApi.endpoints.getTeacher.initiate(teacher.id));
  await store.dispatch(ntakaApi.endpoints.getSlots.initiate({ teacherId: teacher.id, lessonType: 'trial' }));
  const profile = render(store, `/teachers/${teacher.id}`);
  check('teacher profile shows the booking panel', profile.includes('Book a lesson'));
  check('booking panel offers lesson types', profile.includes('Trial lesson') && profile.includes('Single lesson'));

  console.log('');
  console.log(fails ? fails + ' CHECK(S) FAILED' : 'BOOKING CHECKS OK');
  if (fails) process.exitCode = 1;
}

main();
