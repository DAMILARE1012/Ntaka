import { useState } from 'react';
import { SearchInput } from '@/components/ui/Field';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import LevelBadge from '@/components/common/LevelBadge';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { hasQuizFor } from '@/services/mock/placement';
import { cx } from '@/lib/format';
import Flag from '@/components/common/Flag';
import { useAppSelector } from '@/app/hooks';
import { selectLearner } from '@/features/learner/learnerSlice';

/**
 * Step 1 — which language are we placing you in?
 *
 * Languages the learner has already placed in are pushed to the bottom and labelled with
 * the level they hold, rather than being offered as though they were new. They stay
 * clickable, because retaking after a few months of study is exactly the right thing to
 * do; what would be wrong is presenting a language they tested last week as unfinished
 * business. The untested languages come first because that is what someone arriving here
 * a second time is looking for.
 */
export default function LanguagePicker({ onChoose }) {
  const [query, setQuery] = useState('');
  const { levels } = useAppSelector(selectLearner);

  const results = LANGUAGES_FULL.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(query.toLowerCase()) ||
      (l.country ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  const placedIn = (id) => levels[id]?.level ?? null;
  const ordered = [
    ...results.filter((l) => !placedIn(l.id)),
    ...results.filter((l) => placedIn(l.id)),
  ];
  const placedCount = results.filter((l) => placedIn(l.id)).length;

  return (
    <div>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={`Search ${LANGUAGES_FULL.length} languages, or a country`}
        className="mx-auto max-w-md"
      />

      {placedCount > 0 && !query && (
        <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted">
          You have already placed in {placedCount}{' '}
          {placedCount === 1 ? 'language' : 'languages'} — those are at the end. Your results
          are kept; picking one again is a retake, not a fresh start.
        </p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((language) => {
          const level = placedIn(language.id);
          return (
            <button
              key={language.id}
              type="button"
              onClick={() => onChoose(language.id)}
              className={cx(
                'group flex items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition-all',
                'hover:-translate-y-0.5 hover:border-brand-border hover:shadow-card',
                level ? 'border-brand-border bg-brand-soft/40' : 'border-line',
              )}
            >
              <Flag iso={language.iso} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-display font-semibold text-fg">
                    {language.name}
                  </span>
                  {level ? (
                    <LevelBadge code={level} showName={false} />
                  ) : hasQuizFor(language.id) ? (
                    <Badge tone="palm">Graded quiz</Badge>
                  ) : (
                    <Badge tone="neutral">Self-check</Badge>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {level ? 'Already placed — retake' : `${language.nativeName} · ${language.country}`}
                </span>
              </span>
              <Icon
                name="chevronRight"
                className="h-5 w-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </button>
          );
        })}
      </div>

      {!results.length && (
        <p className="mt-10 text-center text-muted">
          No language matches “{query}”. We are adding more every month.
        </p>
      )}
    </div>
  );
}
