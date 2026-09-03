import { useEffect } from 'react';
import { SITE, absolute } from '@/lib/seo';

/**
 * Head manager, no dependency.
 *
 * On the server it writes into a per-render registry that scripts/prerender.jsx drains
 * and bakes into the static HTML - which is the only version most crawlers ever read,
 * since social bots and many search engines do not execute JavaScript.
 *
 * On the client it patches document.head so the tags stay correct as the user navigates
 * and so anything that does re-render the page sees the right metadata.
 */

const isServer = typeof window === 'undefined';

/* ------------------------------------------------------------ server registry */

let registry = null;

export const beginHeadCapture = () => {
  registry = { title: '', meta: [], link: [], jsonLd: [] };
  return registry;
};

export const endHeadCapture = () => {
  const captured = registry;
  registry = null;
  return captured;
};

/* ------------------------------------------------------------------- tag list */

function buildTags({ title, description, path, image, noindex, type, jsonLd, keywords }) {
  const canonical = absolute(path ?? '/');
  const ogImage = absolute(image ?? SITE.ogImage);

  const meta = [
    { name: 'description', content: description },
    { name: 'robots', content: noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1' },
    keywords?.length ? { name: 'keywords', content: keywords.join(', ') } : null,

    { property: 'og:type', content: type ?? 'website' },
    { property: 'og:site_name', content: SITE.name },
    { property: 'og:locale', content: SITE.locale },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `${SITE.name} — ${SITE.tagline}` },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: SITE.twitter },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
  ].filter(Boolean);

  return { title, meta, link: [{ rel: 'canonical', href: canonical }], jsonLd: jsonLd ? [jsonLd] : [] };
}

/* ------------------------------------------------------------- DOM application */

function applyToDocument({ title, meta, link, jsonLd }) {
  document.title = title;

  meta.forEach((tag) => {
    const key = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
    let el = document.head.querySelector(key);
    if (!el) {
      el = document.createElement('meta');
      if (tag.name) el.setAttribute('name', tag.name);
      else el.setAttribute('property', tag.property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', tag.content ?? '');
  });

  link.forEach((tag) => {
    let el = document.head.querySelector(`link[rel="${tag.rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', tag.rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', tag.href);
  });

  // Structured data is replaced wholesale on every navigation - stale nodes from the
  // previous page would describe content that is no longer on screen.
  document.head.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove());
  jsonLd.forEach((data) => {
    const el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo-jsonld', '');
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
  });
}

export default function Seo(props) {
  const tags = buildTags(props);

  // Server: collect during render. renderToString is synchronous and single-pass,
  // so the registry holds exactly this page's tags when it returns.
  if (isServer && registry) {
    registry.title = tags.title;
    registry.meta.push(...tags.meta);
    registry.link.push(...tags.link);
    registry.jsonLd.push(...tags.jsonLd);
  }

  useEffect(() => {
    if (!isServer) applyToDocument(tags);
    // Re-run whenever the rendered head actually changes.
  }, [JSON.stringify(tags)]);

  return null;
}
