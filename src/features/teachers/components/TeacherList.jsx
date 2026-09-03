import { useAppDispatch, useAppSelector, useDebounced } from '@/app/hooks';
import { useGetTeachersQuery } from '@/services/api';
import TeacherCard from '@/features/teachers/components/TeacherCard';
import { SORT_OPTIONS } from '@/features/teachers/components/TeacherFilters';
import Pagination from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Field';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatCount } from '@/lib/format';
import {
  selectTeacherFilters,
  setSort,
  setPage,
  clearFilters,
} from '@/features/teachers/teachersSlice';

/** Connected list: reads the filter slice, queries the API, renders the results. */
export default function TeacherList({ heading }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectTeacherFilters);
  const debouncedQuery = useDebounced(filters.q, 300);

  const { data, isFetching, isError, refetch } = useGetTeachersQuery({
    ...filters,
    q: debouncedQuery,
  });

  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {data ? (
            <>
              <span className="font-semibold text-fg">{formatCount(data.total)}</span>{' '}
              {heading ?? 'teachers available'}
            </>
          ) : (
            'Finding teachers…'
          )}
        </p>
        <Select
          label="Sort by"
          value={filters.sort}
          onChange={(v) => dispatch(setSort(v))}
          options={SORT_OPTIONS}
          className="w-52"
        />
      </div>

      {isFetching && !data ? (
        <div className="space-y-5">
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <div className={isFetching ? 'space-y-5 opacity-60 transition-opacity' : 'space-y-5'}>
            {data.items.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={(p) => dispatch(setPage(p))}
            className="mt-10"
          />
        </>
      ) : (
        <EmptyState
          icon="search"
          title="No teachers match those filters"
          description="Try widening your price range, clearing a speciality, or removing the availability filter."
          actionLabel="Clear filters"
          onAction={() => dispatch(clearFilters())}
        />
      )}
    </div>
  );
}
