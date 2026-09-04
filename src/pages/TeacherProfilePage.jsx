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
import BookingPanel from '@/features/booking/components/BookingPanel';
import { cx, formatCount, formatPrice } from '@/lib/format';
import Seo from '@/components/common/Seo';
import { teacherSeo } from '@/lib/seo';
import { graph, teacherPerson, breadcrumbs } from '@/lib/structuredData';

export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const { data: teacher, isLoading, isError, refetch } = useGetTeacherQuery(teacherId);

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
              An overview of {teacher.name.split(' ')[0]}&rsquo;s open hours in your timezone.
              Exact start times are in the booking box.
            </p>
            <div className="surface-card mt-4 p-5">
              <AvailabilityGrid availability={teacher.availability} />
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

        <BookingPanel teacher={teacher} />
      </div>
    </>
  );
}
