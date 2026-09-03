import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { SearchInput, Select, Checkbox, FilterPill } from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { CEFR_LEVELS } from '@/lib/cefr';
import { CLASS_TOPICS } from '@/services/mock/classes';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import {
  selectClassFilters,
  selectActiveClassFilterCount,
  setQuery,
  setFilter,
  clearFilters,
} from '@/features/classes/classesSlice';

export const CLASS_SORT_OPTIONS = [
  { value: 'soonest', label: 'Starting soonest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'seats-left', label: 'Almost full' },
  { value: 'level', label: 'Level: A1 upwards' },
];

/** Horizontal filter bar for the group-class listing. */
export default function ClassFilters({ lockLanguage = false }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectClassFilters);
  const activeCount = useAppSelector(selectActiveClassFilterCount);

  const set = (key, value) => dispatch(setFilter({ key, value }));

  return (
    <div className="surface-card p-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <SearchInput
          value={filters.q}
          onChange={(v) => dispatch(setQuery(v))}
          placeholder="Search classes by topic or language"
        />
        {!lockLanguage && (
          <Select
            label="Language"
            value={filters.languageId}
            onChange={(v) => set('languageId', v)}
            options={[
              { value: '', label: 'All languages' },
              ...LANGUAGES_FULL.map((l) => ({ value: l.id, label: l.name })),
            ]}
            className="md:w-56"
          />
        )}
        <Select
          label="Topic"
          value={filters.topic}
          onChange={(v) => set('topic', v)}
          options={[
            { value: '', label: 'All topics' },
            ...CLASS_TOPICS.map((t) => ({ value: t.key, label: t.label })),
          ]}
          className="md:w-56"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">Level</span>
        <FilterPill active={!filters.level} onClick={() => set('level', '')}>
          Any
        </FilterPill>
        {CEFR_LEVELS.map((level) => (
          <FilterPill
            key={level.code}
            active={filters.level === level.code}
            onClick={() => set('level', filters.level === level.code ? '' : level.code)}
          >
            {level.code} · {level.name}
          </FilterPill>
        ))}

        <span className="mx-2 hidden h-5 w-px bg-line sm:block" />

        <Checkbox
          checked={filters.onlyAvailable}
          onChange={(v) => set('onlyAvailable', v)}
          label="Seats available"
        />

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch(clearFilters())}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover"
          >
            <Icon name="close" className="h-4 w-4" />
            Clear {activeCount}
          </button>
        )}
      </div>
    </div>
  );
}
