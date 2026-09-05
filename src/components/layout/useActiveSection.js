import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Which section wins, given how much of each is on screen.
 *
 * Pulled out of the effect so it can be tested without a browser. Two rules: the most
 * visible section wins, and when nothing is visible at all the answer is null rather than
 * the last thing seen - at the top of a page the honest answer is "no section".
 *
 * Ties go to the earlier entry, which is document order, so a reader scrolling down never
 * sees the highlight jump backwards between two equally visible sections.
 */
export function pickActive(ratios) {
  let best = null;
  let bestRatio = 0;
  for (const [id, ratio] of ratios) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = id;
    }
  }
  return bestRatio > 0 ? best : null;
}

/** Observer options, exported so the check can assert them without a DOM. */
export const observerOptions = (offset) => ({
  /*
   * Top margin clears the sticky header, so a section hidden behind it does not count as
   * visible. The -45% at the bottom means a section has to reach the upper half of the
   * viewport before it wins, which stops the highlight flickering between two sections
   * while one is merely peeking in from below.
   */
  rootMargin: `-${offset}px 0px -45% 0px`,
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
});

/**
 * Which on-page section the reader is currently looking at.
 *
 * Needed because React Router's NavLink can only compare pathnames, and a link to
 * `/#partners` has the pathname `/`. That made "Partners" light up the instant the
 * homepage loaded — while the reader was still in the hero, nowhere near the partner band —
 * and then never change again however far they scrolled. Active but static, which is worse
 * than no highlight at all: it tells the reader something false about where they are.
 *
 * IntersectionObserver rather than a scroll listener, because a scroll handler fires on
 * every frame and has to measure element positions itself, which forces layout. The
 * observer does the same job off the main thread and only calls back when something
 * actually crosses a boundary.
 *
 * Returns null when no section is in view — at the top of the page, that is the truthful
 * answer, and the nav shows nothing highlighted.
 */
export default function useActiveSection(ids, { offset = 56 } = {}) {
  const [active, setActive] = useState(null);
  const { pathname } = useLocation();

  // Stable primitive dependency: the array is rebuilt on every render by callers.
  const key = ids.join(',');

  useEffect(() => {
    // No DOM during prerendering, and older browsers without the observer simply get no
    // highlight rather than a broken one.
    if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const elements = key
      .split(',')
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!elements.length) {
      setActive(null);
      return undefined;
    }

    // How much of each section is on screen. Kept outside the callback because the
    // observer only reports the entries that changed, not the full set.
    const ratios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        setActive(pickActive(ratios));
      },
      observerOptions(offset),
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // pathname is a dependency because navigating replaces the whole page: the elements
    // observed here are gone and the new ones need observing.
  }, [key, pathname, offset]);

  return active;
}
