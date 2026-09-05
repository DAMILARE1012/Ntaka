import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import LevelBadge from '@/components/common/LevelBadge';
import VideoThumb from '@/components/common/VideoThumb';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleSavedCourse, selectIsCourseSaved } from '@/features/learner/learnerSlice';
import { cx, formatCompact, formatDuration, formatPrice } from '@/lib/format';
import { SUBSCRIPTION_MONTHLY } from '@/lib/pricing';

/** Self-paced video course card. */
export default function CourseCard({ course }) {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectIsCourseSaved(course.id));

  return (
    <article className="surface-card flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <Link to={`/interactive-learning/${course.id}`} className="block">
        <VideoThumb
          seed={course.id}
          label={course.languageName}
          caption={course.trackLabel}
          iso={course.iso}
          className="rounded-none"
        >
          <span className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-2xs font-semibold text-white backdrop-blur">
            {course.lessonCount} lessons · {formatDuration(course.totalMinutes)}
          </span>
        </VideoThumb>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/interactive-learning/${course.id}`}
            className="font-display text-base font-semibold leading-snug text-fg hover:text-brand"
          >
            {course.title}
          </Link>
          <button
            type="button"
            onClick={() => dispatch(toggleSavedCourse(course.id))}
            aria-label={saved ? 'Remove from saved' : 'Save course'}
            aria-pressed={saved}
            className={cx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
              saved
                ? 'border-brand-border bg-brand-soft text-brand'
                : 'border-line text-faint hover:border-line-strong hover:text-brand',
            )}
          >
            <Icon
              name="heart"
              className="h-4 w-4"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
            />
          </button>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{course.promise}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <LevelBadge code={course.level} />
          {course.isOpen && <Badge tone="palm">Open</Badge>}
        </div>

        <div className="mt-4 flex items-center gap-3">
          {course.teacher && (
            <>
              <Avatar name={course.teacher.name} size="xs" />
              <span className="truncate text-xs font-semibold text-muted">
                {course.teacher.name}
              </span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <Rating value={course.rating} reviews={course.reviews} />
            <p className="mt-1 text-xs text-muted">
              {formatCompact(course.enrolled)} learners enrolled
            </p>
          </div>
          <div className="text-right">
            {/* Courses are not sold one by one any more - access comes with the plan. */}
            <p className="text-sm font-semibold text-fg">
              {course.isOpen ? 'Free to read' : 'In your plan'}
            </p>
            <p className="mt-0.5 text-2xs text-faint">
              {course.isOpen ? 'No account needed' : `From ${formatPrice(SUBSCRIPTION_MONTHLY)} a month`}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
