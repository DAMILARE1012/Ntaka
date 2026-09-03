import { useState } from 'react';
import { SearchInput } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { hasQuizFor } from '@/services/mock/placement';
import { cx } from '@/lib/format';
import Flag from '@/components/common/Flag';

/** Step 1 — which language are we placing you in? */
export default function LanguagePicker({ onChoose }) {
  const [query, setQuery] = useState('');

  const results = LANGUAGES_FULL.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(query.toLowerCase()) ||
      (l.country ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={`Search ${LANGUAGES_FULL.length} languages, or a country`}
        className="mx-auto max-w-md"
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((language) => (
          <button
            key={language.id}
            type="button"
            onClick={() => onChoose(language.id)}
            className={cx(
              'group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-all',
              'hover:-translate-y-0.5 hover:border-brand-border hover:shadow-card',
            )}
          >
            <Flag iso={language.iso} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-display font-semibold text-fg">
                  {language.name}
                </span>
                {hasQuizFor(language.id) ? (
                  <Badge tone="palm">Graded quiz</Badge>
                ) : (
                  <Badge tone="neutral">Self-check</Badge>
                )}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">
                {language.nativeName} · {language.country}
              </span>
            </span>
            <Icon
              name="chevronRight"
              className="h-5 w-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
            />
          </button>
        ))}
      </div>

      {!results.length && (
        <p className="mt-10 text-center text-muted">
          No language matches “{query}”. We are adding more every month.
        </p>
      )}
    </div>
  );
}
