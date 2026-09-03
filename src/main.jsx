import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '@/app/store';
import App from '@/App';
import '@/index.css';

const container = document.getElementById('root');

const tree = (
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

// Pages built by scripts/prerender.jsx arrive with markup already in place: hydrate it
// rather than discarding it. A plain `npm run build` ships an empty shell, so fall back.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
