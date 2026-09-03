import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '@/app/store';
import HomePage from '@/pages/HomePage';

const html = renderToString(
  React.createElement(
    Provider,
    { store },
    React.createElement(MemoryRouter, { initialEntries: ['/'] }, React.createElement(HomePage)),
  ),
);

const text = html
  .replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<\/(p|h1|h2|h3|li|dd|dt|blockquote|figcaption|div|section|a|button)>/g, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 1);

let words = 0;
for (const line of text) {
  const n = line.split(/\s+/).length;
  words += n;
  const flag = n > 22 ? ' <== LONG' : '';
  console.log(String(n).padStart(3), line + flag);
}
console.log('\nTOTAL WORDS ON PAGE:', words);
