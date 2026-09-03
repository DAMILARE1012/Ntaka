import { Link, useParams } from 'react-router-dom';
import {
  useGetLanguageQuery,
  useGetTeachersQuery,
  useGetClassesQuery,
  useGetCoursesQuery,
} from '@/services/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Skeleton, { SkeletonGrid } from '@/components/ui/Skeleton';
import { ErrorState, SectionHeading } from '@/components/ui/States';
import LevelLadder from '@/components/common/LevelLadder';
import TeacherMiniCard from '@/features/teachers/components/TeacherMiniCard';
import ClassCard from '@/features/classes/components/ClassCard';
import CourseCard from '@/features/videos/components/CourseCard';
import LanguageCard from '@/features/languages/components/LanguageCard';
import { useAppSelector } from '@/app/hooks';
import { selectLevelFor } from '@/features/learner/learnerSlice';
import { formatCompact } from '@/lib/format';
import Flag from '@/components/common/Flag';
import Seo from '@/components/common/Seo';
import { languageSeo } from '@/lib/seo';
import { graph, languagePage, breadcrumbs } from '@/lib/structuredData';

export default function LanguageDetailPage() {
  const { languageId } = useParams();
  const { data: language, isLoading, isError, refetch } = useGetLanguageQuery(languageId);
  const placedLevel = useAppSelector(selectLevelFor(languageId));

  const { data: teachers } = useGetTeachersQuery({ languageId, pageSize: 3 }, { skip: !language });
  const { data: classes } = useGetClassesQuery({ languageId, pageSize: 2 }, { skip: !language });
  const { data: courses } = useGetCoursesQuery({ languageId, pageSize: 3 }, { skip: !language });

  if (isError) {
    return (
      <div className="container py-14">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !language) {
    return (
      <div className="container space-y-6 py-12">
        <Skeleton className="h-56 rounded-3xl" />
        <SkeletonGrid count={3} />
      </div>
    );
  }

  return (
    <>
      <Seo
        {...languageSeo(language)}
        jsonLd={graph(
          languagePage(language),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Languages', path: '/languages' },
            { name: language.name, path: `/languages/${language.id}` },
          ]),
        )}
      />

      {/* ------------------------------------------------------------- hero */}
      <section className="border-b border-line bg-surface">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <Link to="/languages" className="link-arrow mb-5 inline-flex">
              <Icon name="arrowLeft" className="h-4 w-4" />
              All languages
            </Link>

            <div className="flex items-center gap-4">
              <Flag iso={language.iso} size="lg" className="h-9 w-12" />
              <div>
                <h1 className="font-display text-3xl font-semibold">{language.name}</h1>
                <p className="text-muted">
                  {language.nativeName} · {language.country}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-md leading-relaxed text-fg">
              {language.blurb}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {language.tonal && <Badge tone="savanna">Tonal language</Badge>}
              <Badge tone="adire">{language.family}</Badge>
              <Badge tone="neutral">{language.script}</Badge>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button to={`/teachers?language=${language.id}`} size="lg">
                Find a {language.name} teacher
              </Button>
              <Button to="/placement-test" variant="outline" size="lg">
                <Icon name="target" className="h-4 w-4" />
                Free placement test
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-subtle p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Say hello in {language.name}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-brand">
              {language.greeting}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-5 text-sm">
              {[
                { label: 'Speakers', value: formatCompact(language.speakers) },
                { label: 'Teachers', value: language.teacherCount },
                { label: 'Group classes', value: language.classCount },
                { label: 'Video courses', value: language.courseCount },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs text-faint">{stat.label}</dt>
                  <dd className="font-display text-xl font-semibold text-fg">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            {language.alsoSpokenIn?.length > 0 && (
              <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
                Also spoken in {language.alsoSpokenIn.join(', ')}.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- why learn */}
      <section className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-xl font-semibold">Why learn {language.name}?</h2>
            <ul className="mt-5 space-y-3">
              {language.whyLearn.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-md text-fg">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                    <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {placedLevel ? `You are placed at ${placedLevel}` : 'Where would you start?'}
            </h2>
            <p className="mt-2 text-muted">
              {placedLevel
                ? 'Teachers, classes and courses below can all be filtered to your level.'
                : `Take the free placement check and we will tell you which of the six CEFR levels to begin ${language.name} at.`}
            </p>
            <LevelLadder current={placedLevel} className="mt-5" compact />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- teachers */}
      {teachers?.items.length > 0 && (
        <section className="bg-surface py-14">
          <div className="container">
            <SectionHeading
              eyebrow="1-on-1 lessons"
              title={`${language.teacherCount} ${language.name} teachers`}
              action={
                <Button to={`/teachers?language=${language.id}`} variant="outline">
                  See all
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
              }
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.items.map((teacher) => (
                <TeacherMiniCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- classes */}
      {classes?.items.length > 0 && (
        <section className="container py-14">
          <SectionHeading
            eyebrow="Group classes"
            title={`Upcoming ${language.name} classes`}
            action={
              <Button to={`/classes?language=${language.id}`} variant="outline">
                See all
                <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
            }
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {classes.items.map((groupClass) => (
              <ClassCard key={groupClass.id} groupClass={groupClass} />
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- courses */}
      {courses?.items.length > 0 && (
        <section className="bg-surface py-14">
          <div className="container">
            <SectionHeading
              eyebrow="Video learning"
              title={`Self-paced ${language.name} courses`}
              action={
                <Button to={`/video-learning?language=${language.id}`} variant="outline">
                  See all
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
              }
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.items.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- siblings */}
      {language.siblings?.length > 0 && (
        <section className="container py-14">
          <SectionHeading
            eyebrow="Same country"
            title={`Other languages of ${language.country}`}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {language.siblings.map((sibling) => (
              <LanguageCard key={sibling.id} language={sibling} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
