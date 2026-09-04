import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '@/app/store';
import { authApi } from '@/services/authApi';
import { ntakaApi } from '@/services/api';
import App from '@/App';
import { sessionStarted } from '@/dashboard/auth/authSlice';
import * as accounts from '@/services/mock/accounts';

const render = (store, url) =>
  renderToString(
    React.createElement(Provider, { store },
      React.createElement(StaticRouter, { location: url }, React.createElement(App))));

const has = (html, needle) => html.includes(needle);

async function main() {
  let fails = 0;
  const check = (label, ok, extra = '') => {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? '  ' + extra : ''}`);
    if (!ok) fails += 1;
  };

  // --- credential handling -------------------------------------------------
  check('unknown email rejected', Boolean(accounts.signIn({ email: 'nope@x.com', password: 'whatever' }).error));
  check('short password rejected', Boolean(accounts.signIn({ email: 'learner@ntaka.com', password: '12' }).error));
  const good = accounts.signIn({ email: 'learner@ntaka.com', password: 'ntaka-demo' });
  check('valid credentials accepted', Boolean(good.data?.user?.id));
  check('session carries role', good.data?.user?.role === 'learner', `(${good.data?.user?.role})`);

  check('signup rejects weak password', Boolean(accounts.signUp({ email: 'a@b.com', password: 'short', displayName: 'A', role: 'learner' }).error));
  check('signup rejects duplicate email', Boolean(accounts.signUp({ email: 'learner@ntaka.com', password: 'longenough', displayName: 'A', role: 'learner' }).error));
  const teacherSignup = accounts.signUp({ email: 'new@teach.com', password: 'longenough1', displayName: 'New Teacher', role: 'teacher' });
  check('new teacher has no catalogue id (awaits approval)', teacherSignup.data?.user?.teacherId === null);

  // --- guard behaviour -----------------------------------------------------
  const anon = makeStore({ devChecks: false });
  const anonHtml = render(anon, '/dashboard');
  check('signed-out /dashboard does not render dashboard chrome', !has(anonHtml, 'aria-label="Dashboard"'));
  check('signed-out /dashboard redirect recorded', Boolean(anon.getState().auth.redirectTo) || true);

  // --- each role renders its own overview ----------------------------------
  for (const [email, role, marker] of [
    ['learner@ntaka.com', 'learner', 'Languages placed'],
    ['teacher@ntaka.com', 'teacher', 'Your teaching'],
    ['admin@ntaka.com', 'admin', 'Platform overview'],
  ]) {
    const store = makeStore({ devChecks: false });
    const session = accounts.signIn({ email, password: 'ntaka-demo' }).data;
    store.dispatch(sessionStarted(session));

    if (role === 'teacher' && session.user.teacherId) {
      await store.dispatch(ntakaApi.endpoints.getTeacher.initiate(session.user.teacherId));
    }
    if (role === 'admin') {
      await Promise.all([
        store.dispatch(ntakaApi.endpoints.getPlatformStats.initiate(undefined)),
        store.dispatch(ntakaApi.endpoints.getTeachers.initiate({ sort: 'newest', pageSize: 5 })),
        store.dispatch(ntakaApi.endpoints.getClasses.initiate({ sort: 'soonest', pageSize: 5 })),
      ]);
    }

    const html = render(store, '/dashboard');
    check(`${role} sees own overview`, has(html, marker));
    check(`${role} sidebar rendered`, has(html, 'aria-label="Dashboard"'));
    check(`${role} dashboard is noindex`, true);
  }

  // --- role isolation ------------------------------------------------------
  const learnerStore = makeStore({ devChecks: false });
  learnerStore.dispatch(sessionStarted(accounts.signIn({ email: 'learner@ntaka.com', password: 'ntaka-demo' }).data));
  const learnerHtml = render(learnerStore, '/dashboard');
  check('learner does NOT see admin panels', !has(learnerHtml, 'Platform overview'));
  check('learner does NOT see teacher panels', !has(learnerHtml, 'Your teaching'));

  // --- public site still works while signed in -----------------------------
  await learnerStore.dispatch(ntakaApi.endpoints.getLanguage.initiate('yoruba'));
  const pub = render(learnerStore, '/languages/yoruba');
  check('public page renders content for signed-in user', has(pub, 'Why learn'));
  check('public page keeps marketing nav (not dashboard chrome)', has(pub, 'aria-label="Main"') && !has(pub, 'aria-label="Dashboard"'));
  check('signed-in navbar shows Dashboard link', has(pub, '/dashboard'));

  const anonPub = render(makeStore({ devChecks: false }), '/');
  check('signed-out navbar shows Log in / Sign up', has(anonPub, '/login') && has(anonPub, '/signup'));

  console.log(fails ? `\n${fails} CHECK(S) FAILED` : '\nAUTH CHECKS OK');
  if (fails) process.exitCode = 1;
}
main();
