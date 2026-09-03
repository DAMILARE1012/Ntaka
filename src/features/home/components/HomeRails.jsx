import { useGetClassesQuery, useGetCoursesQuery } from '@/services/api';
import { SectionHeading } from '@/components/ui/States';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ClassCard from '@/features/classes/components/ClassCard';
import CourseCard from '@/features/videos/components/CourseCard';

/** Next group classes starting across the platform. */
export function UpcomingClasses() {
  const { data, isFetching } = useGetClassesQuery({ sort: 'soonest', pageSize: 3, onlyAvailable: true });

  return (
    <section className="py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="Group classes"
          title="Starting soon"
          description="Four to ten learners, one level, one topic."
          action={
            <Button to="/classes" variant="outline">
              All group classes
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-10">
          {isFetching && !data ? (
            <SkeletonGrid count={3} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((groupClass) => (
                <ClassCard key={groupClass.id} groupClass={groupClass} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Most popular self-paced video courses. */
export function PopularCourses() {
  const { data, isFetching } = useGetCoursesQuery({ sort: 'popular', pageSize: 3 });

  return (
    <section className="bg-surface py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="Video learning"
          title="Learn at your own pace"
          description="Structured like a syllabus. Short enough for a commute."
          action={
            <Button to="/video-learning" variant="outline">
              All video courses
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-10">
          {isFetching && !data ? (
            <SkeletonGrid count={3} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
