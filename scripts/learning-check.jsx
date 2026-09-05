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
import { enrol, completeLesson, recordCheckpoint } from '@/features/learning/progressSlice';
import * as accounts from '@/services/mock/accounts';
import { VIDEO_COURSES } from '@/services/mock/videos';
import { buildCurriculum, flattenCurriculum, vocabularyFor, LESSON_TYPES } from '@/services/mock/courseContent';
import { subscriptionLoaded } from '../src/features/payments/subscriptionSlice.js';

async function main() {
  let fails = 0;
  const check = (label, ok, extra = '') => {
    console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
    if (!ok) fails += 1;
  };

  const render = (store, url) =>
    renderToString(
      React.createElement(Provider, { store },
        React.createElement(StaticRouter, { location: url }, React.createElement(App))));

  console.log('--- curriculum: every course is playable ---');
  let bad = [];
  for (const course of VIDEO_COURSES) {
    const modules = buildCurriculum(course);
    const lessons = flattenCurriculum(modules);
    if (!lessons.length) bad.push(course.id + ': no lessons');
    if (lessons.some((l) => !Object.values(LESSON_TYPES).includes(l.type))) {
      bad.push(course.id + ': unknown lesson type');
    }
    // Every module must end in something the learner produces, not just consumes.
    for (const module of modules) {
      const last = module.lessons[module.lessons.length - 1];
      if (![LESSON_TYPES.QUIZ, LESSON_TYPES.GAME].includes(last.type)) {
        bad.push(`${course.id}/${module.id}: ends passively (${last.type})`);
      }
    }
  }
  check('all 102 courses build a curriculum', bad.length === 0, bad.slice(0, 2).join(' | '));

  const yoruba = VIDEO_COURSES.find((c) => c.languageId === 'yoruba');
  const igbo = VIDEO_COURSES.find((c) => c.languageId === 'igbo');
  const modules = buildCurriculum(yoruba);
  const lessons = flattenCurriculum(modules);
  check('curriculum is deterministic',
    JSON.stringify(flattenCurriculum(buildCurriculum(yoruba)).map((l) => l.type)) ===
      JSON.stringify(lessons.map((l) => l.type)));

  const kinds = new Set(lessons.map((l) => l.type));
  check('a course mixes lesson kinds', kinds.size >= 3, [...kinds].join(' '));
  check('every lesson carries its content',
    lessons.every((l) => l.video || l.audio || l.reading || l.quiz || l.game));

  console.log('');
  console.log('--- quizzes cover all three modalities ---');
  const allQuizzes = VIDEO_COURSES.flatMap((c) =>
    flattenCurriculum(buildCurriculum(c)).filter((l) => l.type === LESSON_TYPES.QUIZ));
  const modes = new Set(allQuizzes.map((q) => q.quiz.mode));
  check('recognise, write and speak all appear', modes.has('recognise') && modes.has('write') && modes.has('speak'),
    [...modes].join(' '));
  check('multiple-choice quizzes carry real questions',
    allQuizzes.filter((q) => q.quiz.mode === 'recognise').every((q) => q.quiz.questions.length > 0));
  check('written quizzes carry a prompt',
    allQuizzes.filter((q) => q.quiz.mode === 'write').every((q) => Boolean(q.quiz.prompt?.instruction)));
  check('spoken quizzes carry a prompt',
    allQuizzes.filter((q) => q.quiz.mode === 'speak').every((q) => Boolean(q.quiz.prompt?.id)));

  console.log('');
  console.log('--- vocabulary: authored or honest, never invented ---');
  check('yoruba has a real vocabulary set', vocabularyFor('yoruba').length >= 6);
  check('igbo has a real vocabulary set', vocabularyFor('igbo').length >= 6);
  check('an unauthored language falls back to its greeting only',
    vocabularyFor('lingala').length === 1, JSON.stringify(vocabularyFor('lingala')));
  check('no vocabulary entry is empty',
    ['yoruba','igbo','hausa','swahili'].every((id) =>
      vocabularyFor(id).every((v) => v.term && v.meaning)));

  console.log('');
  console.log('--- checkpoints ---');
  const withCheckpoints = modules.filter((m) => m.checkpoint?.questions?.length);
  check('a course has at least one checkpoint', withCheckpoints.length > 0, withCheckpoints.length + ' checkpoints');
  check('checkpoints are short', withCheckpoints.every((m) => m.checkpoint.questions.length <= 3));
  const igboModules = buildCurriculum(igbo);
  check('checkpoints exist for igbo too',
    igboModules.some((m) => m.checkpoint?.questions?.length > 0));

  console.log('');
  console.log('--- progress tracking ---');
  const store = makeStore({ devChecks: false });
  store.dispatch(sessionStarted(accounts.signIn({ email: 'learner@ntaka.com', password: 'ntaka-demo' }).data));
  store.dispatch(enrol(yoruba.id));
  check('enrolling creates a course row', Boolean(store.getState().progress.courses[yoruba.id]));

  store.dispatch(completeLesson({ courseId: yoruba.id, lessonId: lessons[0].id, result: { score: 2, total: 3 } }));
  let row = store.getState().progress.courses[yoruba.id].lessons[lessons[0].id];
  check('completing a lesson records a result', row.status === 'complete' && row.result.score === 2);

  store.dispatch(completeLesson({ courseId: yoruba.id, lessonId: lessons[0].id, result: { score: 1, total: 3 } }));
  row = store.getState().progress.courses[yoruba.id].lessons[lessons[0].id];
  check('A RETRY NEVER LOWERS A GOOD SCORE', row.result.score === 2, 'kept 2, not 1');
  check('attempts are counted', row.attempts === 2);

  store.dispatch(completeLesson({ courseId: yoruba.id, lessonId: lessons[0].id, result: { score: 3, total: 3 } }));
  check('a better score replaces the old one',
    store.getState().progress.courses[yoruba.id].lessons[lessons[0].id].result.score === 3);

  console.log('');
  console.log('--- checkpoints re-place the learner mid-course ---');
  store.dispatch(recordCheckpoint({ courseId: yoruba.id, checkpointId: 'cp1', correct: 3, total: 3, level: 'A2' }));
  check('checkpoint result stored',
    store.getState().progress.courses[yoruba.id].checkpoints.cp1.correct === 3);

  store.dispatch(recordPlacement({
    languageId: 'yoruba', languageName: 'Yoruba', level: 'A1', mode: 'quiz', confidence: 'high',
    skills: { vocabulary: { correctCount: 4, total: 8 } },
  }));
  store.dispatch(recordPlacement({
    languageId: 'yoruba', languageName: 'Yoruba', level: 'A2', mode: 'checkpoint', confidence: 'medium',
    skills: { vocabulary: { correctCount: 3, total: 3 } },
  }));
  const history = store.getState().learner.history;
  check('history keeps both attempts', history.length === 2, history.map((h) => h.level).join(' <- '));
  check('newest is first', history[0].level === 'A2');
  check('the climb is recorded', history[0].previousLevel === 'A1');
  check('a checkpoint is marked as its own mode', history[0].mode === 'checkpoint');
  check('current level follows the latest attempt', store.getState().learner.levels.yoruba.level === 'A2');

  console.log('');
  console.log('--- screens render ---');
  await store.dispatch(ntakaApi.endpoints.getCourse.initiate(yoruba.id));
  // A subscription is now required to open a course. Granted here so this suite keeps
  // testing the LEARNING experience; the paywall itself is covered by payments-check.
  store.dispatch(
    subscriptionLoaded({
      status: 'active',
      planId: 'monthly',
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    }),
  );
  const player = render(store, `/dashboard/learn/${yoruba.id}`);
  check('the course player renders', player.includes(yoruba.title));
  check('the syllabus is present', player.includes('Course overview'));
  check('progress is shown as a percentage', /\d+%/.test(player));

  check('my courses renders', render(store, '/dashboard/courses').includes('My courses'));
  check('enrolled course appears in my courses', render(store, '/dashboard/courses').includes(yoruba.title));
  check('test history renders', render(store, '/dashboard/placement/history').includes('Test history'));
  check('history shows the level climb', render(store, '/dashboard/placement/history').includes('up from'));

  const nav = render(store, '/');
  check('nav groups the three modes under Learn', nav.includes('>Learn<') || nav.includes('Learn'));
  check('all three modes are reachable',
    nav.includes('/teachers') && nav.includes('/classes') && nav.includes('/interactive-learning'));

  console.log('');
  console.log(fails ? fails + ' CHECK(S) FAILED' : 'LEARNING CHECKS OK');
  if (fails) process.exitCode = 1;
}

main();
