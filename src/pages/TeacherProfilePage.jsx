import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetTeacherQuery } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import Skeleton from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import LevelBadge from '@/components/common/LevelBadge';
import AvailabilityGrid from '@/components/common/AvailabilityGrid';
import VideoThumb from '@/components/common/VideoThumb';
import { SpokenLanguages } from '@/components/common/ProficiencyBars';
import TeacherMiniCard from '@/features/teachers/components/TeacherMiniCard';
import ClassCard from '@/features/classes/components/ClassCard';
import CourseCard from '@/features/videos/components/CourseCard';
import { TIME_BLOCKS } from '@/lib/schedule';
import { cx, formatCount, formatPrice } from '@/lib/format';
import Seo from '@/components/common/Seo';
import { teacherSeo } from '@/lib/seo';
import { graph, teacherPerson, breadcrumbs } from '@/lib/structuredData';

function BookingPanel({ teacher, selectedSlot }) {
  const [packageIndex, setPackageIndex] = useState(0);
  const pack = teacher.packages[packageIndex];
  const packTotal = teacher.hourlyRate * pack.lessons * (1 - pack.discount);

  return (
    <div className="surface-card p-5 lg:sticky lg:top-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Trial lesson</p>
      <p className="mt-1 font-display text-2xl font-semibold text-fg">
        {formatPrice(teacher.trialPrice)}
      </p>
      <p className="text-sm text-muted">30 minutes · one per teacher</p>

      <Button fullWidth size="lg" className="mt-4">
        Book a trial lesson
      </Button>
      <Button fullWidth variant="outline" className="mt-2">
        <Icon name="message" className="h-4 w-4" />
        Message {teacher.name.split(' ')[0]}
      </Button>

      {selectedSlot && (
        <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-hover">
          Selected: {new Date(selectedSlot.date).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
          , {TIME_BLOCKS[selectedSlot.block].label}
        </p>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Lesson packages</p>
        <div className="mt-3 flex gap-2">
          {teacher.packages.map((option, i) => (
            <button
              key={option.lessons}
              type="button"
              onClick={() => setPackageIndex(i)}
              className={cx(
                'flex-1 rounded-xl border px-2 py-2.5 text-center transition-colors',
                packageIndex === i
                  ? 'border-brand bg-brand-soft'
                  : 'border-line hover:border-line-strong',
              )}
            >
              <span className="block font-display text-base font-semibold text-fg">
                {option.lessons}
              </span>
              <span className="block text-2xs font-semibold text-muted">
                −{Math.round(option.discount * 100)}%
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 flex items-baseline justify-between text-sm">
          <span className="text-muted">{pack.lessons} × 60 min</span>
          <span className="font-display text-lg font-semibold text-fg">
            {formatPrice(packTotal)}
          </span>
        </p>
        <p className="text-xs text-muted">
          {formatPrice(packTotal / pack.lessons)} per lesson · normally{' '}
          {formatPrice(teacher.hourlyRate)}
        </p>
      </div>

      <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Responds in</dt>
          <dd className="font-semibold text-fg">{teacher.responseTime}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Attendance</dt>
          <dd className="font-semibold text-fg">{teacher.attendanceRate}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Students</dt>
          <dd className="font-semibold text-fg">{formatCount(teacher.students)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const { data: teacher, isLoading, isError, refetch } = useGetTeacherQuery(teacherId);
  const [selectedSlot, setSelectedSlot] = useState(null);

  if (isError) {
    return (
      <div className="container py-14">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !teacher) {
    return (
      <div className="container grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <Seo
        {...teacherSeo(teacher)}
        type="profile"
        jsonLd={graph(
          teacherPerson(teacher),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: '1-on-1 lessons', path: '/teachers' },
            { name: teacher.languageName, path: `/languages/${teacher.languageId}` },
            { name: teacher.name, path: `/teachers/${teacher.id}` },
          ]),
        )}
      />

      <div className="border-b border-line bg-surface">
        <div className="container py-8">
          <Link
            to={`/teachers?language=${teacher.languageId}`}
            className="link-arrow mb-6 inline-flex"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            All {teacher.languageName} teachers
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={teacher.name} iso={teacher.iso} size="xl" />

            <div className="min-w-0 flex-1">
              <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-semibold">
                {teacher.name}
                {teacher.verified && (
                  <Icon name="badgeCheck" className="h-6 w-6 text-brand" strokeWidth={2} />
                )}
              </h1>
              <p className="mt-1 text-muted">
                <span className="font-semibold text-fg">{teacher.typeLabel}</span> ·{' '}
                {teacher.country} · {teacher.years} years teaching
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <Rating value={teacher.rating} reviews={teacher.reviews} size="lg" />
                <span className="text-sm text-muted">
                  <span className="font-semibold text-fg">
                    {formatCount(teacher.lessons)}
                  </span>{' '}
                  lessons taught
                </span>
                {teacher.instantLesson && (
                  <Badge tone="savanna">
                    <Icon name="bolt" className="h-3 w-3" />
                    Instant lesson
                  </Badge>
                )}
              </div>

              <SpokenLanguages speaks={teacher.speaks} max={4} className="mt-4" />

              <div className="mt-4 flex flex-wrap gap-2">
                {teacher.levels.map((level) => (
                  <LevelBadge key={level} code={level} showName={false} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-10">
          {teacher.hasVideoIntro && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">Introduction</h2>
              <VideoThumb
                seed={teacher.id}
                label={teacher.languageName}
                caption={`Meet ${teacher.name}`}
                iso={teacher.iso}
              />
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold">About me</h2>
            <p className="mt-3 text-md leading-relaxed text-fg">{teacher.headline}.</p>
            <p className="mt-3 text-md leading-relaxed text-fg">{teacher.bio}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {teacher.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Availability</h2>
            <p className="mt-2 text-sm text-muted">
              Pick a four-hour band and {teacher.name.split(' ')[0]} will confirm an exact start
              time. Green blocks are open.
            </p>
            <div className="surface-card mt-4 p-5">
              <AvailabilityGrid
                availability={teacher.availability}
                onSelect={setSelectedSlot}
              />
            </div>
          </section>

          {teacher.classes?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Group classes with {teacher.name.split(' ')[0]}</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {teacher.classes.map((groupClass) => (
                  <ClassCard
                    key={groupClass.id}
                    groupClass={{ ...groupClass, teacher }}
                  />
                ))}
              </div>
            </section>
          )}

          {teacher.courses?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Video courses</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {teacher.courses.map((course) => (
                  <CourseCard key={course.id} course={{ ...course, teacher }} />
                ))}
              </div>
            </section>
          )}

          {teacher.similar?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Other {teacher.languageName} teachers</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {teacher.similar.map((other) => (
                  <TeacherMiniCard key={other.id} teacher={other} />
                ))}
              </div>
            </section>
          )}
        </div>

        <BookingPanel teacher={teacher} selectedSlot={selectedSlot} />
      </div>
    </>
  );
}
