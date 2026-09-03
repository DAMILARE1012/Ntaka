import { useAppDispatch, useAppSelector, useDebounced } from '@/app/hooks';
import { useGetCoursesQuery } from '@/services/api';
import CourseCard from '@/features/videos/components/CourseCard';
import { VIDEO_SORT_OPTIONS } from '@/features/videos/components/CourseFilters';
import Pagination from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Field';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { formatCount } from '@/lib/format';
import { selectVideoFilters, setSort, setPage, clearFilters } from '@/features/videos/videosSlice';

export default function CourseList() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectVideoFilters);
  const debouncedQuery = useDebounced(filters.q, 300);

  const { data, isFetching, isError, refetch } = useGetCoursesQuery({
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
              <span className="font-semibold text-fg">{formatCount(data.total)}</span> self-paced
              courses
            </>
          ) : (
            'Loading courses…'
          )}
        </p>
        <Select
          label="Sort by"
          value={filters.sort}
          onChange={(v) => dispatch(setSort(v))}
          options={VIDEO_SORT_OPTIONS}
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
                ? 'grid gap-5 opacity-60 transition-opacity sm:grid-cols-2 xl:grid-cols-3'
                : 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3'
            }
          >
            {data.items.map((course) => (
              <CourseCard key={course.id} course={course} />
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
          icon="video"
          title="No courses match those filters"
          description="Try another track or level — or ask a teacher to record what you need."
          actionLabel="Clear filters"
          onAction={() => dispatch(clearFilters())}
        />
      )}
    </div>
  );
}
