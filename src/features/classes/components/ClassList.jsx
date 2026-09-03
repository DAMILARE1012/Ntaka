import { useAppDispatch, useAppSelector, useDebounced } from '@/app/hooks';
import { useGetClassesQuery } from '@/services/api';
import ClassCard from '@/features/classes/components/ClassCard';
import { CLASS_SORT_OPTIONS } from '@/features/classes/components/ClassFilters';
import Pagination from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Field';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatCount } from '@/lib/format';
import { selectClassFilters, setSort, setPage, clearFilters } from '@/features/classes/classesSlice';

export default function ClassList() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectClassFilters);
  const debouncedQuery = useDebounced(filters.q, 300);

  const { data, isFetching, isError, refetch } = useGetClassesQuery({
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
              <span className="font-semibold text-fg">{formatCount(data.total)}</span> group
              classes scheduled
            </>
          ) : (
            'Loading classes…'
          )}
        </p>
        <Select
          label="Sort by"
          value={filters.sort}
          onChange={(v) => dispatch(setSort(v))}
          options={CLASS_SORT_OPTIONS}
          className="w-52"
        />
      </div>

      {isFetching && !data ? (
        <SkeletonGrid count={6} />
      ) : data?.items.length ? (
        <>
          <div
            className={
              isFetching
                ? 'grid gap-5 opacity-60 transition-opacity md:grid-cols-2 xl:grid-cols-3'
                : 'grid gap-5 md:grid-cols-2 xl:grid-cols-3'
            }
          >
            {data.items.map((groupClass) => (
              <ClassCard key={groupClass.id} groupClass={groupClass} />
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
          icon="calendar"
          title="No classes match those filters"
          description="Group classes are scheduled a few weeks ahead. Try another level or topic, or book a 1-on-1 lesson instead."
          actionLabel="Clear filters"
          onAction={() => dispatch(clearFilters())}
        />
      )}
    </div>
  );
}
