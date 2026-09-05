/* eslint-disable no-console */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '@/app/store';
import { ntakaApi } from '@/services/api';
import App from '@/App';
import { sessionStarted } from '@/dashboard/auth/authSlice';
import { recordPlacement } from '@/features/learner/learnerSlice';
import * as accounts from '@/services/mock/accounts';
import { TEACHERS } from '@/services/mock/teachers';
import { GROUP_CLASSES } from '@/services/mock/classes';
import { VIDEO_COURSES } from '@/services/mock/videos';
import { subscriptionLoaded } from '../src/features/payments/subscriptionSlice.js';

async function main() {
  let fails = 0;
  const check = (label, ok, extra = '') => {
    console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
    if (!ok) fails += 1;
  };

  // React 18 puts <!-- --> between adjacent text nodes, which breaks naive substring
  // matching on anything built from an expression. Strip them before asserting.
  const render = (store, url) =>
    renderToString(
      React.createElement(Provider, { store },
        React.createElement(StaticRouter, { location: url }, React.createElement(App))),
    ).split('<!-- -->').join('');

  const teacher = TEACHERS.find((t) => t.languageId === 'yoruba');
  const klass = GROUP_CLASSES.find((c) => c.languageId === 'yoruba');
  const course = VIDEO_COURSES.find((c) => c.languageId === 'yoruba');
  const igboCourse = VIDEO_COURSES.find((c) => c.languageId === 'igbo');

  const signedIn = async () => {
    const store = makeStore({ devChecks: false });
    store.dispatch(sessionStarted(accounts.signIn({ email: 'learner@ntaka.com', password: 'ntaka-demo' }).data));
    await Promise.all([
      store.dispatch(ntakaApi.endpoints.getTeacher.initiate(teacher.id)),
      store.dispatch(ntakaApi.endpoints.getSlots.initiate({ teacherId: teacher.id, lessonType: 'trial' })),
      store.dispatch(ntakaApi.endpoints.getClass.initiate(klass.id)),
      store.dispatch(ntakaApi.endpoints.getCourse.initiate(course.id)),
      store.dispatch(ntakaApi.endpoints.getCourse.initiate(igboCourse.id)),
      store.dispatch(ntakaApi.endpoints.getLanguage.initiate('yoruba')),
    ]);
    return store;
  };

  const GATE_TEXT = 'placement test first';
  const BLOCKED = 'Find your level first';

  console.log('--- UNPLACED LEARNER IS BLOCKED EVERYWHERE ---');
  const unplaced = await signedIn();

  const profile = render(unplaced, `/teachers/${teacher.id}`);
  check('1-on-1: gate is shown', profile.includes(GATE_TEXT));
  check('1-on-1: book button is blocked', profile.includes(BLOCKED));

  const classPage = render(unplaced, `/classes/${klass.id}`);
  check('group class: gate is shown', classPage.includes(GATE_TEXT));
  check('group class: reserve button is blocked', classPage.includes(BLOCKED));
  check('group class: no "Reserve my seat" offered', !classPage.includes('Reserve my seat'));

  const coursePage = render(unplaced, `/interactive-learning/${course.id}`);
  check('course: gate is shown', coursePage.includes(GATE_TEXT));
  check('course: start button is blocked', coursePage.includes(BLOCKED));
  check('course: no link into the player', !coursePage.includes(`/dashboard/learn/${course.id}`));

  const player = render(unplaced, `/dashboard/learn/${course.id}`);
  check('PLAYER ITSELF REFUSES TO OPEN', player.includes('Find your Yor'), 'direct URL blocked');
  check('player shows no lesson content', !player.includes('Course overview'));
  check('player did not enrol the learner',
    !unplaced.getState().progress.courses[course.id], 'no progress row created');

  console.log('');
  console.log('--- BROWSING STAYS OPEN ---');
  check('teacher listing still renders', render(unplaced, '/teachers').includes('Find your teacher'));
  check('class listing still renders', render(unplaced, '/classes').includes('Learn with other people'));
  check('course listing still renders', render(unplaced, '/interactive-learning').includes('Self-paced'));
  check('language pages still render', render(unplaced, '/languages/yoruba').includes('Why learn'));
  check('teacher profile still shows availability', profile.includes('Availability'));

  console.log('');
  console.log('--- NO ESCAPE HATCH ---');
  check('the "I know my level" escape is gone', !profile.includes('I know my level'));
  check('gate offers only the test', profile.includes('Take the free test'));
  check('gate carries the language and the way back',
    profile.includes('language=yoruba') && profile.includes('returnTo='));

  console.log('');
  console.log('--- PLACED LEARNER IS LET THROUGH ---');
  const placed = await signedIn();
  placed.dispatch(recordPlacement({
    languageId: 'yoruba', languageName: 'Yoruba', level: 'A2', mode: 'quiz', confidence: 'high',
    skills: { vocabulary: { correctCount: 5, total: 8 } },
  }));

  const okProfile = render(placed, `/teachers/${teacher.id}`);
  check('1-on-1: gate is gone', !okProfile.includes(GATE_TEXT));
  check('1-on-1: booking is offered', !okProfile.includes(BLOCKED));

  const okClass = render(placed, `/classes/${klass.id}`);
  check('group class: reserve is offered', okClass.includes('Reserve my seat') || okClass.includes('waitlist'));

  const okCourse = render(placed, `/interactive-learning/${course.id}`);
  check('course: start is offered', okCourse.includes(`/dashboard/learn/${course.id}`));
  // Interactive learning now needs a subscription as well as a level. Granting one here
  // keeps this suite testing the PLACEMENT gate rather than accidentally testing the
  // paywall - scripts/payments-check.jsx covers that separately.
  const subscribe = (s) =>
    s.dispatch(
      subscriptionLoaded({
        status: 'active',
        planId: 'monthly',
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      }),
    );
  subscribe(placed);
  check('player opens', render(placed, `/dashboard/learn/${course.id}`).includes('Course overview'));

  console.log('');
  console.log('--- THE GATE IS PER LANGUAGE ---');
  const igbo = render(placed, `/interactive-learning/${igboCourse.id}`);
  check('PLACED IN YORUBA STILL BLOCKED IN IGBO', igbo.includes(GATE_TEXT), 'per-language, as designed');
  check('the Igbo gate names Igbo', igbo.includes('Igbo placement test'));

  console.log('');
  console.log('--- TEACHERS AND ADMINS ARE NOT GATED ---');
  const teacherStore = makeStore({ devChecks: false });
  teacherStore.dispatch(sessionStarted(accounts.signIn({ email: 'teacher@ntaka.com', password: 'ntaka-demo' }).data));
  await teacherStore.dispatch(ntakaApi.endpoints.getCourse.initiate(course.id));
  check('a teacher browsing a course sees no learner gate',
    !render(teacherStore, `/interactive-learning/${course.id}`).includes(GATE_TEXT));

  console.log('');
  console.log('--- SIGNED OUT: SIGN IN COMES FIRST ---');
  const anon = makeStore({ devChecks: false });
  await Promise.all([
    anon.dispatch(ntakaApi.endpoints.getTeacher.initiate(teacher.id)),
    anon.dispatch(ntakaApi.endpoints.getSlots.initiate({ teacherId: teacher.id, lessonType: 'trial' })),
  ]);
  const anonProfile = render(anon, `/teachers/${teacher.id}`);
  check('signed out sees "Sign in to book", not the gate', anonProfile.includes('Sign in to book'));
  check('signed out can still see prices and availability', anonProfile.includes('Trial lesson'));

  console.log('');
  console.log(fails ? fails + ' CHECK(S) FAILED' : 'GATE CHECKS OK');
  if (fails) process.exitCode = 1;
}

main();
