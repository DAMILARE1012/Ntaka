import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import LevelBadge, { LevelRange } from '@/components/common/LevelBadge';
import { SpokenLanguages } from '@/components/common/ProficiencyBars';
import AvailabilityGrid from '@/components/common/AvailabilityGrid';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleSavedTeacher, selectIsTeacherSaved } from '@/features/learner/learnerSlice';
import { cx, formatCount, formatPrice } from '@/lib/format';

/**
 * The 1-on-1 teacher card: identity and rating on the left, live availability and
 * booking on the right — the two things a learner decides on.
 */
export default function TeacherCard({ teacher, showAvailability = true }) {
  const dispatch = useAppDispatch();
  const saved = useAppSelector(selectIsTeacherSaved(teacher.id));

  return (
    <article className="surface-card overflow-hidden transition-shadow duration-200 hover:shadow-lift">
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:p-6">
        {/* ---------------------------------------------------------- profile */}
        <div className="min-w-0">
          <div className="flex gap-4">
            <Link to={`/teachers/${teacher.id}`} className="shrink-0">
              <Avatar name={teacher.name} iso={teacher.iso} size="lg" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <Link
                    to={`/teachers/${teacher.id}`}
                    className="inline-flex items-center gap-1.5 font-display text-lg font-semibold text-fg hover:text-brand"
                  >
                    {teacher.name}
                    {teacher.verified && (
                      <Icon name="badgeCheck" className="h-4 w-4 text-brand" strokeWidth={2} />
                    )}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span
                      className={cx(
                        'font-semibold',
                        teacher.type === 'professional' ? 'text-brand' : 'text-muted',
                      )}
                    >
                      {teacher.typeLabel}
                    </span>
                    <span className="text-faint">·</span>
                    <span className="text-muted">{teacher.country}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch(toggleSavedTeacher(teacher.id))}
                  aria-label={saved ? 'Remove from saved' : 'Save teacher'}
                  aria-pressed={saved}
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
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

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <Rating value={teacher.rating} reviews={teacher.reviews} />
                <span className="text-sm text-muted">
                  {formatCount(teacher.lessons)} lessons
                </span>
                {teacher.instantLesson && (
                  <Badge tone="savanna">
                    <Icon name="bolt" className="h-3 w-3" />
                    Instant lesson
                  </Badge>
                )}
              </div>

              <SpokenLanguages speaks={teacher.speaks} className="mt-3" />
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted">
            {teacher.headline}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {teacher.tags.map((tag) => (
              <Badge key={tag} tone="neutral">
                {tag}
              </Badge>
            ))}
            <LevelBadge code={teacher.levels[0]} showName={false} />
            <LevelRange levels={teacher.levels} />
          </div>
        </div>

        {/* ----------------------------------------------------- availability */}
        <div className="flex flex-col gap-4 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {showAvailability && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                Next 7 days
              </p>
              <AvailabilityGrid availability={teacher.availability} compact />
            </div>
          )}

          <div className="mt-auto">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Trial lesson</p>
                <p className="font-display text-xl font-semibold text-fg">
                  {formatPrice(teacher.trialPrice)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Per hour</p>
                <p className="font-display text-base font-semibold text-fg">
                  {formatPrice(teacher.hourlyRate)}
                </p>
              </div>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {teacher.nextAvailable}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button to={`/teachers/${teacher.id}`} variant="outline" size="sm">
                View profile
              </Button>
              <Button to={`/teachers/${teacher.id}`} size="sm">
                Book trial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
