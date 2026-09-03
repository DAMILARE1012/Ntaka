import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { SearchInput, Select, Checkbox, FilterPill } from '@/components/ui/Field';
import Icon from '@/components/ui/Icon';
import { CEFR_LEVELS } from '@/lib/cefr';
import { TEACHER_TAGS } from '@/services/mock/teachers';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { formatPrice } from '@/lib/format';
import {
  selectTeacherFilters,
  selectActiveFilterCount,
  setQuery,
  setFilter,
  toggleTag,
  clearFilters,
} from '@/features/teachers/teachersSlice';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'lessons', label: 'Most experienced' },
  { value: 'newest', label: 'New teachers' },
];

/** Sticky filter rail for the 1-on-1 teacher list. */
export default function TeacherFilters({ lockLanguage = false }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectTeacherFilters);
  const activeCount = useAppSelector(selectActiveFilterCount);

  const set = (key, value) => dispatch(setFilter({ key, value }));

  return (
    <aside className="lg:sticky lg:top-20">
      <div className="surface-card divide-y divide-line">
        <div className="p-5">
          <SearchInput
            value={filters.q}
            onChange={(v) => dispatch(setQuery(v))}
            placeholder="Search teachers"
          />
        </div>

        {!lockLanguage && (
          <FilterGroup title="Language">
            <Select
              label="Language"
              value={filters.languageId}
              onChange={(v) => set('languageId', v)}
              options={[
                { value: '', label: 'All languages' },
                ...LANGUAGES_FULL.map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
          </FilterGroup>
        )}

        <FilterGroup title="Availability">
          <div className="space-y-3">
            <Checkbox
              checked={filters.availableWithin72h}
              onChange={(v) => set('availableWithin72h', v)}
              label="Within 72 hours"
              description="Has open slots in the next three days"
            />
            <Checkbox
              checked={filters.instantLesson}
              onChange={(v) => set('instantLesson', v)}
              label="Instant lesson"
              description="Can start within the hour"
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Your level">
          <div className="flex flex-wrap gap-2">
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
          </div>
        </FilterGroup>

        <FilterGroup title="Teacher type">
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'All' },
              { value: 'professional', label: 'Professional' },
              { value: 'community', label: 'Community' },
            ].map((option) => (
              <FilterPill
                key={option.value}
                active={filters.type === option.value}
                onClick={() => set('type', option.value)}
              >
                {option.label}
              </FilterPill>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Price per hour">
          <input
            type="range"
            min={5}
            max={45}
            step={1}
            value={filters.maxPrice ?? 45}
            onChange={(e) => {
              const value = Number(e.target.value);
              set('maxPrice', value >= 45 ? null : value);
            }}
            className="w-full accent-brand"
            aria-label="Maximum price per hour"
          />
          <p className="mt-1.5 text-sm font-semibold text-fg">
            {filters.maxPrice == null ? 'Any price' : `Up to ${formatPrice(filters.maxPrice)}/hr`}
          </p>
        </FilterGroup>

        <FilterGroup title="Rating">
          <div className="flex flex-wrap gap-2">
            {[0, 4.5, 4.8].map((value) => (
              <FilterPill
                key={value}
                active={filters.minRating === value}
                onClick={() => set('minRating', value)}
              >
                {value === 0 ? 'Any' : `${value}+`}
              </FilterPill>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Specialities">
          <div className="flex flex-wrap gap-2">
            {TEACHER_TAGS.map((tag) => (
              <FilterPill
                key={tag}
                active={filters.tags.includes(tag)}
                onClick={() => dispatch(toggleTag(tag))}
              >
                {tag}
              </FilterPill>
            ))}
          </div>
        </FilterGroup>

        {activeCount > 0 && (
          <div className="p-5">
            <button
              type="button"
              onClick={() => dispatch(clearFilters())}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover"
            >
              <Icon name="close" className="h-4 w-4" />
              Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{title}</h3>
      {children}
    </div>
  );
}

export { SORT_OPTIONS };
