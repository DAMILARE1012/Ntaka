import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { SearchInput, Select, Checkbox, FilterPill } from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { CEFR_LEVELS } from '@/lib/cefr';
import { VIDEO_TRACKS } from '@/services/mock/videos';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import {
  selectVideoFilters,
  selectActiveVideoFilterCount,
  setQuery,
  setFilter,
  clearFilters,
} from '@/features/videos/videosSlice';

export const VIDEO_SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'shortest', label: 'Shortest first' },
  { value: 'newest', label: 'Recently updated' },
];

export default function CourseFilters({ lockLanguage = false }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectVideoFilters);
  const activeCount = useAppSelector(selectActiveVideoFilterCount);

  const set = (key, value) => dispatch(setFilter({ key, value }));

  return (
    <div className="surface-card p-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <SearchInput
          value={filters.q}
          onChange={(v) => dispatch(setQuery(v))}
          placeholder="Search courses"
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
          label="Track"
          value={filters.track}
          onChange={(v) => set('track', v)}
          options={[
            { value: '', label: 'All tracks' },
            ...VIDEO_TRACKS.map((t) => ({ value: t.key, label: t.label })),
          ]}
          className="md:w-52"
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
            {level.code}
          </FilterPill>
        ))}

        <span className="mx-2 hidden h-5 w-px bg-line sm:block" />

        <Checkbox
          checked={filters.openOnly}
          onChange={(v) => set('openOnly', v)}
          label="Open courses only"
          description="Readable without a subscription"
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
