/**
 * Small hand-rolled icon set (stroke-based, 24x24 grid) so the app carries no icon
 * dependency. Add a new key here rather than dropping raw SVG into a component.
 */
const PATHS = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  chevronRight: 'm9 18 6-6-6-6',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronDown: 'm6 9 6 6 6-6',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  arrowLeft: 'M19 12H5m6 6-6-6 6-6',
  check: 'm5 13 4 4L19 7',
  close: 'M18 6 6 18M6 6l12 12',
  menu: 'M4 7h16M4 12h16M4 17h16',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  users: 'M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 20v-1.5a4 4 0 0 0-3-3.87M16 3.63a4 4 0 0 1 0 7.75',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  video: 'M15.5 10.5 22 7v10l-6.5-3.5M2.5 6h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
  calendar: 'M8 3v4m8-4v4M3.5 9.5h17M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z',
  clock: 'M12 7v5l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18',
  heart: 'M12 20.5S3.5 15.4 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6c0 5.8-8.5 10.9-8.5 10.9Z',
  sparkles: 'M12 3.5 13.7 8l4.5 1.7-4.5 1.7L12 16l-1.7-4.6L5.8 9.7 10.3 8 12 3.5ZM18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z',
  filter: 'M4 5h16l-6.4 7.5V19l-3.2 1.6v-8.1L4 5Z',
  badgeCheck: 'm9 12 2 2 4-4M12 3l2.2 1.7 2.7-.3 1 2.6 2.4 1.3-.7 2.7.7 2.7-2.4 1.3-1 2.6-2.7-.3L12 21l-2.2-1.7-2.7.3-1-2.6-2.4-1.3.7-2.7-.7-2.7 2.4-1.3 1-2.6 2.7.3L12 3Z',
  message: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-3.4-.6L3 21l1.7-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5v-14ZM4 19.5A2.5 2.5 0 0 0 6.5 22H20',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5.5-5.5 2 2-5.5 5.5-2Z',
  shield: 'M12 21s7-3.2 7-9V5.8L12 3 5 5.8V12c0 5.8 7 9 7 9Z',
  mic: 'M12 15a3.5 3.5 0 0 0 3.5-3.5v-5a3.5 3.5 0 1 0-7 0v5A3.5 3.5 0 0 0 12 15Zm7-3.5a7 7 0 0 1-14 0M12 18.5V22',
  headphones: 'M4 15v-3a8 8 0 1 1 16 0v3M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z',
  certificate: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3 .8V22l3-1.8 3 1.8v-6.2',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  /*
   * The universal access symbol - round head, outstretched arms, legs apart. Drawn as
   * a filled glyph rather than a stroke, because at 20px the stroked version loses the
   * gap between the head and the shoulders and reads as a blob.
   *
   * This shape is worth using exactly rather than inventing something prettier: people
   * who need it scan for it, and a bespoke icon is one they have to stop and decode.
   */
  accessibility:
    'M12 2.05a2.15 2.15 0 1 0 0 4.3 2.15 2.15 0 0 0 0-4.3ZM21 9.15h-5.85V22h-2.1v-6.05h-2.1V22H8.85V9.15H3V7.05h18v2.1Z',
};

/** Icons drawn as filled shapes. Everything else is stroked on the same 24x24 grid. */
const FILLED = new Set(['play', 'accessibility']);

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8, ...rest }) {
  const d = PATHS[name];
  if (!d) return null;
  // Glyphs that are solid shapes rather than line drawings.
  const filled = FILLED.has(name);
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

/** Filled star, kept separate because ratings need a solid mark. */
export function StarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m12 17.3-6.2 3.7 1.7-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.5 4.8 1.7 7L12 17.3Z" />
    </svg>
  );
}
