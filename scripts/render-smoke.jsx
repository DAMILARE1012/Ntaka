import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '@/app/store';
import App from '@/App';
import * as db from '@/services/mock/db';
import { QUESTION_BANKS } from '@/services/mock/placement';
import { chooseLanguage, setResult } from '@/features/placement/placementSlice';
import { setFilter } from '@/features/teachers/teachersSlice';

const teacherId = db.listTeachers({ pageSize: 1 }).items[0].id;
const classId = db.listClasses({ pageSize: 1 }).items[0].id;
const courseId = db.listVideos({ pageSize: 1 }).items[0].id;

const routes = [
  '/',
  '/teachers',
  `/teachers/${teacherId}`,
  '/classes',
  `/classes/${classId}`,
  '/interactive-learning',
  `/interactive-learning/${courseId}`,
  '/languages',
  '/languages/yoruba',
  '/languages/lingala',
  '/placement-test',
  '/does-not-exist',
];

let failures = 0;
for (const route of routes) {
  try {
    const html = renderToString(
      React.createElement(
        Provider,
        { store },
        React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)),
      ),
    );
    console.log(`ok   ${route.padEnd(28)} ${html.length} bytes`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${route}\n     ${err.message}`);
  }
}

// Render the placement result screen with real scored data.
const perfect = Object.fromEntries(QUESTION_BANKS.yoruba.map((q) => [q.id, q.answerId]));
const result = db.submitPlacement({ languageId: 'yoruba', answers: perfect, selfChecked: ['A1', 'A2'] });
store.dispatch(chooseLanguage('yoruba'));
store.dispatch(setResult(result));
store.dispatch(setFilter({ key: 'level', value: 'B1' }));

try {
  const html = renderToString(
    React.createElement(
      Provider,
      { store },
      React.createElement(MemoryRouter, { initialEntries: ['/placement-test'] }, React.createElement(App)),
    ),
  );
  const shows = html.includes('C2') && html.includes('Yorùbá');
  console.log(`ok   placement result screen  ${html.length} bytes  level+language rendered: ${shows}`);
  if (!shows) failures += 1;
} catch (err) {
  failures += 1;
  console.log('FAIL placement result\n     ' + err.message);
}

console.log(failures ? `\n${failures} ROUTE(S) FAILED` : '\nRENDER SMOKE OK');
if (failures) process.exit(1);
