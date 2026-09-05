/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';

import { makeStore } from '@/app/store';
import { ntakaApi } from '@/services/api';
import App from '@/App';
import { beginHeadCapture, endHeadCapture } from '@/components/common/Seo';
import { SITE, absolute } from '@/lib/seo';
import * as db from '@/services/mock/db';

/**
 * Static pre-rendering.
 *
 * A client-rendered SPA serves crawlers an empty <div id="root">. Google can execute
 * JavaScript but defers it and does so unreliably at scale; Bing, and every social
 * crawler that builds a link preview, does not execute it at all. So every route is
 * rendered to real HTML at build time and written as its own index.html.
 *
 * Data is preloaded into a fresh store per route before rendering, because RTK Query
 * subscribes inside an effect and effects never run during renderToString.
 */

const DIST = path.resolve('dist');
const TEMPLATE = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* -------------------------------------------------------------------- routes */

const languages = db.listLanguages({});
const teachers = db.listTeachers({ pageSize: 10000 }).items;
const classes = db.listClasses({ pageSize: 10000, onlyAvailable: false }).items;
const courses = db.listVideos({ pageSize: 10000 }).items;

const ep = ntakaApi.endpoints;

/** Which queries each route needs warmed before it can render its real content. */
const routes = [
  {
    url: '/',
    priority: '1.0',
    changefreq: 'daily',
    preload: () => {
      const featured = languages.filter((l) => l.featured);
      return [
        ep.getPlatformStats.initiate(undefined),
        ep.getLanguages.initiate({}),
        ep.getTeachers.initiate({
          languageId: featured[0]?.id ?? '',
          sort: 'recommended',
          pageSize: 2,
        }),
        ep.getClasses.initiate({ sort: 'soonest', pageSize: 3, onlyAvailable: true }),
        ep.getCourses.initiate({ sort: 'popular', pageSize: 3 }),
      ];
    },
  },
  {
    url: '/teachers',
    priority: '0.9',
    changefreq: 'daily',
    preload: (store) => [ep.getTeachers.initiate(store.getState().teachers)],
  },
  {
    url: '/classes',
    priority: '0.9',
    changefreq: 'daily',
    preload: (store) => [ep.getClasses.initiate(store.getState().classes)],
  },
  {
    url: '/interactive-learning',
    priority: '0.9',
    changefreq: 'weekly',
    preload: (store) => [ep.getCourses.initiate(store.getState().videos)],
  },
  {
    url: '/languages',
    priority: '0.9',
    changefreq: 'weekly',
    preload: () => [ep.getLanguages.initiate({ q: '', region: '' })],
  },
  { url: '/placement-test', priority: '0.9', changefreq: 'monthly', preload: () => [] },
  { url: '/partners', priority: '0.6', changefreq: 'monthly', preload: () => [] },
  { url: '/faq', priority: '0.7', changefreq: 'monthly', preload: () => [] },
  { url: '/pricing', priority: '0.8', changefreq: 'monthly', preload: () => [] },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly', preload: () => [] },
  { url: '/terms', priority: '0.3', changefreq: 'yearly', preload: () => [] },
  { url: '/cookies', priority: '0.3', changefreq: 'yearly', preload: () => [] },

  // Auth screens are prerendered so they paint instantly, but they carry noindex and
  // are kept out of the sitemap. /dashboard is never prerendered at all: it is private,
  // per-user, and there is nothing meaningful to render without a session.
  { url: '/login', sitemap: false, preload: () => [] },
  { url: '/signup', sitemap: false, preload: () => [] },

  ...languages.map((language) => ({
    url: `/languages/${language.id}`,
    priority: '0.8',
    changefreq: 'weekly',
    preload: () => [
      ep.getLanguage.initiate(language.id),
      ep.getTeachers.initiate({ languageId: language.id, pageSize: 3 }),
      ep.getClasses.initiate({ languageId: language.id, pageSize: 2 }),
      ep.getCourses.initiate({ languageId: language.id, pageSize: 3 }),
    ],
  })),

  ...teachers.map((teacher) => ({
    url: `/teachers/${teacher.id}`,
    priority: '0.6',
    changefreq: 'weekly',
    preload: () => [ep.getTeacher.initiate(teacher.id)],
  })),

  ...courses.map((course) => ({
    url: `/interactive-learning/${course.id}`,
    priority: '0.7',
    changefreq: 'monthly',
    preload: () => [ep.getCourse.initiate(course.id)],
  })),

  ...classes.map((item) => ({
    url: `/classes/${item.id}`,
    priority: '0.5',
    changefreq: 'daily',
    preload: () => [ep.getClass.initiate(item.id)],
  })),
];

/* ----------------------------------------------------------------- rendering */

function headToHtml(head) {
  const parts = [];

  head.meta.forEach((tag) => {
    const attr = tag.name ? `name="${esc(tag.name)}"` : `property="${esc(tag.property)}"`;
    parts.push(`    <meta ${attr} content="${esc(tag.content)}" />`);
  });

  head.link.forEach((tag) => {
    parts.push(`    <link rel="${esc(tag.rel)}" href="${esc(tag.href)}" />`);
  });

  head.jsonLd.forEach((data) => {
    // A literal </script> inside the JSON would close the tag early.
    const json = JSON.stringify(data).split('<').join('\\u003c');
    parts.push(`    <script type="application/ld+json">${json}</script>`);
  });

  return parts.join('\n');
}

async function renderRoute(route) {
  const store = makeStore({ devChecks: false });
  const pending = route.preload(store).map((action) => store.dispatch(action));
  await Promise.all(pending);

  const head = beginHeadCapture();
  const body = renderToString(
    React.createElement(
      Provider,
      { store },
      React.createElement(StaticRouter, { location: route.url }, React.createElement(App)),
    ),
  );
  const captured = endHeadCapture();
  pending.forEach((subscription) => subscription.unsubscribe?.());

  let html = TEMPLATE;

  // The shell ships a generic title and description; the page's own replace them.
  if (captured.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(captured.title)}</title>`);
  }
  html = html.replace(/\s*<meta[^>]*name="description"[^>]*\/>/, '');
  html = html.replace('</head>', `${headToHtml(captured)}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  const outDir = path.join(DIST, route.url === '/' ? '' : route.url);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

  return { url: route.url, bytes: Buffer.byteLength(html), head: captured };
}

/* ------------------------------------------------------------------- sitemap */

function writeSitemap(results) {
  const today = new Date().toISOString().slice(0, 10);
  const byUrl = new Map(routes.map((route) => [route.url, route]));

  const urls = results
    .filter(({ url }) => byUrl.get(url)?.sitemap !== false)
    .map(({ url }) => {
      const meta = byUrl.get(url);
      return [
        '  <url>',
        `    <loc>${absolute(url)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${meta.changefreq}</changefreq>`,
        `    <priority>${meta.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf8');

  // robots.txt ships from public/ with a placeholder host; point it at the real one.
  const robotsPath = path.join(DIST, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robots = fs
      .readFileSync(robotsPath, 'utf8')
      .replace(/^Sitemap: .*$/m, `Sitemap: ${absolute('/sitemap.xml')}`);
    fs.writeFileSync(robotsPath, robots, 'utf8');
  }
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const started = Date.now();
  const results = [];
  const problems = [];

  for (const route of routes) {
    try {
      const result = await renderRoute(route);
      results.push(result);

      if (!result.head.title) problems.push(`${route.url}: no <title>`);
      if (!result.head.link.some((link) => link.rel === 'canonical')) {
        problems.push(`${route.url}: no canonical`);
      }
      if (result.bytes < 8000) {
        problems.push(`${route.url}: only ${result.bytes} bytes - did the data preload?`);
      }
    } catch (error) {
      problems.push(`${route.url}: ${error.message}`);
    }
  }

  writeSitemap(results);

  const byUrlForLog = new Map(routes.map((route) => [route.url, route]));
  const bytes = results.reduce((total, result) => total + result.bytes, 0);
  console.log(
    `prerendered ${results.length} pages in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  console.log(`  ${(bytes / results.length / 1024).toFixed(1)}KB of real HTML per page on average`);
  const indexable = results.filter((r) => byUrlForLog.get(r.url)?.sitemap !== false).length;
  console.log(`  sitemap: dist/sitemap.xml (${indexable} urls, base ${SITE.url})`);

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    problems.slice(0, 20).forEach((problem) => console.error(`  ${problem}`));
    process.exitCode = 1;
  }
}

main();
