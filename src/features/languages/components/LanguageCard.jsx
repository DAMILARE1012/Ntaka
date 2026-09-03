import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { cx, formatCompact } from '@/lib/format';
import Flag from '@/components/common/Flag';

/** Every language tile lifts the same way; only the flag distinguishes them. */
const HOVER = 'hover:border-brand-border hover:bg-brand-soft/50';

/** Language tile used on the homepage rail and the languages directory. */
export default function LanguageCard({ language, compact = false }) {
  if (compact) {
    return (
      <Link
        to={`/languages/${language.id}`}
        className={cx(
          'surface-card flex items-center gap-3 px-4 py-3 transition-colors',
          HOVER,
        )}
      >
        <Flag iso={language.iso} size="md" />
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold text-fg">
            {language.name}
          </span>
          <span className="block truncate text-xs text-muted">
            {language.teacherCount ?? 0} teachers
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/languages/${language.id}`}
      className={cx(
        'surface-card group flex h-full flex-col p-5 transition-all duration-200 hover:shadow-lift',
        HOVER,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Flag iso={language.iso} size="lg" />
        {language.tonal && <Badge tone="savanna">Tonal</Badge>}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold text-fg">{language.name}</h3>
      <p className="text-sm text-muted">{language.nativeName}</p>

      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
        {language.blurb}
      </p>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-4 text-xs">
        <div>
          <dt className="text-faint">Speakers</dt>
          <dd className="font-semibold text-fg">{formatCompact(language.speakers)}</dd>
        </div>
        <div>
          <dt className="text-faint">Country</dt>
          <dd className="font-semibold text-fg">{language.country}</dd>
        </div>
        {language.teacherCount != null && (
          <div>
            <dt className="text-faint">Teachers</dt>
            <dd className="font-semibold text-fg">{language.teacherCount}</dd>
          </div>
        )}
      </dl>

      <span className="link-arrow mt-4">
        Start {language.name}
        <Icon
          name="arrowRight"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
