import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetLanguagesQuery } from '@/services/api';
import Skeleton from '@/components/ui/Skeleton';
import { pluralize } from '@/lib/format';
import Flag from '@/components/common/Flag';

/* Measure before the browser paints so tiles never flash at the wrong width.
   useLayoutEffect warns during SSR, where there is nothing to measure anyway. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Pixels per second. Slow enough to read a name as it passes. */
const SPEED = 52;

/** How many tiles sit across the rail at a given width. Four on a normal desktop. */
function tilesAcross(width) {
  if (width < 520) return 2;
  if (width < 900) return 3;
  return 4;
}

function RailItem({ language, width, duplicate }) {
  return (
    <li className="min-w-[8.5rem] shrink-0" style={width ? { width } : undefined}>
      <Link
        to={`/languages/${language.id}`}
        tabIndex={duplicate ? -1 : undefined}
        className="mx-0.5 flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-subtle"
      >
        <Flag iso={language.iso} size="sm" />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-xs font-semibold text-fg">{language.name}</span>
          <span className="block truncate text-2xs leading-tight text-faint">
            {pluralize(language.teacherCount ?? 0, 'teacher')}
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * Auto-scrolling rail of languages.
 *
 * The track carries two identical groups and animates to translateX(-50%), which is
 * exactly one group wide - so the seam never shows. The duplicate is hidden from
 * assistive tech and taken out of the tab order, so the list is announced once.
 */
export default function LanguageRail() {
  const { data, isLoading } = useGetLanguagesQuery({});
  const viewportRef = useRef(null);
  const [itemWidth, setItemWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const measure = () => {
      const width = el.clientWidth;
      if (width) setItemWidth(width / tilesAcross(width));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const languages = [...(data ?? [])].sort((a, b) => b.teacherCount - a.teacherCount);

  // Keep the speed constant regardless of how many languages are in the catalogue.
  const duration = itemWidth && languages.length ? (languages.length * itemWidth) / SPEED : 60;

  return (
    <div className="container -mt-2 pb-12">
      <div className="overflow-hidden rounded-lg border border-line bg-surface py-1">
        {isLoading || !languages.length ? (
          <div className="flex gap-2 px-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 flex-1 rounded-md" />
            ))}
          </div>
        ) : (
          <div ref={viewportRef} className="marquee-viewport overflow-hidden">
            <div
              className="marquee-track"
              style={{ '--marquee-duration': `${duration.toFixed(2)}s` }}
            >
              {[false, true].map((duplicate) => (
                <ul key={String(duplicate)} className="flex shrink-0" aria-hidden={duplicate || undefined}>
                  {languages.map((language) => (
                    <RailItem
                      key={language.id}
                      language={language}
                      width={itemWidth}
                      duplicate={duplicate}
                    />
                  ))}
                </ul>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
