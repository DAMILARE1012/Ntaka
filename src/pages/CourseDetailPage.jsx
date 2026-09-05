import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetCourseQuery } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import Skeleton from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import LevelBadge from '@/components/common/LevelBadge';
import VideoThumb from '@/components/common/VideoThumb';
import CourseCard from '@/features/videos/components/CourseCard';
import { cx, formatCompact, formatDuration, formatPrice } from '@/lib/format';
import PlacementGate from '@/features/placement/components/PlacementGate';
import { usePlacementGate } from '@/features/placement/usePlacementGate';
import Flag from '@/components/common/Flag';
import Seo from '@/components/common/Seo';
import { courseSeo } from '@/lib/seo';
import { graph, videoCourse, breadcrumbs } from '@/lib/structuredData';
import { SUBSCRIPTION_MONTHLY, SUBSCRIPTION_INCLUDES } from '@/lib/pricing';
import { useAppSelector } from '@/app/hooks';
import { selectHasSubscription } from '@/features/payments/subscriptionSlice';

function Curriculum({ modules }) {
  const [openId, setOpenId] = useState(modules[0]?.id);

  return (
    <ul className="surface-card divide-y divide-line overflow-hidden">
      {modules.map((module, i) => {
        const open = openId === module.id;
        const minutes = module.lessons.reduce((n, l) => n + l.minutes, 0);

        return (
          <li key={module.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : module.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle font-display text-sm font-semibold text-fg">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg">{module.title}</span>
                <span className="block text-xs text-muted">
                  {module.lessons.length} lessons · {formatDuration(minutes)}
                </span>
              </span>
              <Icon
                name="chevronDown"
                className={cx(
                  'h-4 w-4 shrink-0 text-faint transition-transform',
                  open && 'rotate-180',
                )}
              />
            </button>

            {open && (
              <ul className="animate-fade-in border-t border-line bg-subtle/50 px-5 py-2">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-3 py-2.5 text-sm text-fg"
                  >
                    <Icon name="play" className="h-3.5 w-3.5 shrink-0 text-faint" />
                    <span className="flex-1">{lesson.title}</span>
                    {lesson.isPreview && <Badge tone="palm">Preview</Badge>}
                    <span className="text-xs text-muted">{lesson.minutes} min</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { data: course, isLoading, isError, refetch } = useGetCourseQuery(courseId);
  const gate = usePlacementGate(course?.languageId);
  const subscribed = useAppSelector(selectHasSubscription);

  if (isError) {
    return (
      <div className="container py-14">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !course) {
    return (
      <div className="container grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <Seo
        {...courseSeo(course)}
        jsonLd={graph(
          videoCourse(course),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Interactive learning', path: '/interactive-learning' },
            { name: course.languageName, path: `/languages/${course.languageId}` },
            { name: course.title, path: `/interactive-learning/${course.id}` },
          ]),
        )}
      />

      <div className="border-b border-line bg-surface">
        <div className="container py-8">
          <Link
            to={`/interactive-learning?language=${course.languageId}`}
            className="link-arrow mb-5 inline-flex"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            All {course.languageName} courses
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="clay">
              <Flag iso={course.iso} size="xs" />
              {course.languageName}
            </Badge>
            <LevelBadge code={course.level} />
            <Badge tone="neutral">{course.trackLabel}</Badge>
            {course.isOpen && <Badge tone="palm">Open course</Badge>}
          </div>

          <h1 className="mt-4 max-w-3xl text-balance font-display text-2xl font-semibold sm:text-3xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{course.promise}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Rating value={course.rating} reviews={course.reviews} size="lg" />
            <span className="text-muted">
              {formatCompact(course.enrolled)} learners enrolled
            </span>
            <span className="text-muted">
              {course.lessonCount} lessons · {formatDuration(course.totalMinutes)}
            </span>
            <span className="text-muted">Updated {course.updatedAt}</span>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-10">
          <VideoThumb
            seed={course.id}
            label={course.languageName}
            caption={course.trackLabel}
            iso={course.iso}
          />

          <section>
            <h2 className="text-lg font-semibold">About this course</h2>
            <p className="mt-3 text-md leading-relaxed text-fg">{course.description}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Curriculum</h2>
            <p className="mt-2 text-sm text-muted">
              {course.modules.length} modules · {course.lessonCount} lessons ·{' '}
              {formatDuration(course.totalMinutes)}
            </p>
            <div className="mt-4">
              <Curriculum modules={course.modules} />
            </div>
          </section>

          {course.teacher && (
            <section>
              <h2 className="text-lg font-semibold">Your instructor</h2>
              <div className="surface-card mt-4 flex flex-wrap items-center gap-5 p-6">
                <Avatar name={course.teacher.name} iso={course.teacher.iso} size="lg" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/teachers/${course.teacher.id}`}
                    className="font-display text-lg font-semibold text-fg hover:text-brand"
                  >
                    {course.teacher.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {course.teacher.typeLabel} · {course.teacher.country}
                  </p>
                  <p className="mt-2 text-sm text-muted">{course.teacher.headline}</p>
                </div>
                <Button to={`/teachers/${course.teacher.id}`} variant="outline" size="sm">
                  Book a live lesson
                </Button>
              </div>
            </section>
          )}

          {course.related?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">More {course.languageName} courses</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {course.related.map((related) => (
                  <CourseCard key={related.id} course={related} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="surface-card h-fit p-5 lg:sticky lg:top-20">
          {/* Interactive learning is a subscription to the platform, so the panel sells
              the plan, not the course. An open course is the exception and says so. */}
          {course.isOpen ? (
            <>
              <p className="font-display text-2xl font-semibold text-fg">Free to read</p>
              <p className="text-sm text-muted">
                An open course — no subscription needed for this one.
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-2xl font-semibold text-fg">
                {formatPrice(SUBSCRIPTION_MONTHLY)}
                <span className="text-base font-normal text-muted"> a month</span>
              </p>
              <p className="text-sm text-muted">
                Included in your subscription, along with every other course in every
                language we teach.
              </p>
            </>
          )}

          {gate.required && (
            <div className="mt-4">
              <PlacementGate
                language={{ id: course.languageId, name: course.languageName }}
                action="start a course"
                compact
              />
            </div>
          )}

          {gate.required ? (
            <Button fullWidth size="lg" className="mt-4" disabled>
              Find your level first
            </Button>
          ) : (
            <Button fullWidth size="lg" className="mt-4" to={`/dashboard/learn/${course.id}`}>
              {course.isOpen || subscribed ? 'Start learning' : 'Start with a subscription'}
            </Button>
          )}
          <Button fullWidth variant="outline" className="mt-2" to="/pricing">
            <Icon name="play" className="h-4 w-4" />
            {course.isOpen ? 'See what a plan adds' : 'Compare plans'}
          </Button>

          {!course.isOpen && (
            <ul className="mt-5 space-y-2 border-t border-line pt-5">
              {SUBSCRIPTION_INCLUDES.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-muted">
                  <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
            {course.includes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-fg">
                <Icon
                  name="check"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  strokeWidth={2.5}
                />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-5 rounded-xl bg-subtle p-4 text-xs text-muted">
            Interactive learning works best alongside live practice.{' '}
            <Link
              to={`/teachers?language=${course.languageId}`}
              className="font-semibold text-brand hover:text-brand-hover"
            >
              Pair it with a 1-on-1 teacher
            </Link>
            .
          </p>
        </aside>
      </div>
    </>
  );
}
