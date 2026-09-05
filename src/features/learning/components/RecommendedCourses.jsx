import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import LevelBadge from '@/components/common/LevelBadge';
import Flag from '@/components/common/Flag';
import { cx, formatDuration } from '@/lib/format';
import { useAppSelector } from '@/app/hooks';
import { selectLearner } from '@/features/learner/learnerSlice';
import { selectAllProgress } from '@/features/learning/progressSlice';
import { VIDEO_COURSES } from '@/services/mock/videos';
import { buildCurriculum, flattenCurriculum } from '@/services/mock/courseContent';
import { recommendCourses, reasonText, REASONS } from '@/features/learning/recommend';

/**
 * Courses recommended to a signed-in learner.
 *
 * Dashboard-only by construction: it reads the learner's placement, so it must never
 * appear on a public page. `scripts/profile-scope-check.js` enforces that boundary — this
 * component living under `features/learning` rather than `components` is what keeps it on
 * the right side of the line.
 *
 * Every card states WHY it is being recommended. A recommendation with no reason is
 * indistinguishable from an advert, and the reason is also the thing that makes a wrong
 * recommendation correctable: a learner who reads "the level after yours" and disagrees
 * knows to retake the test.
 */
export default function RecommendedCourses({ languageId = null, limit = 4, heading, className }) {
  const learner = useAppSelector(selectLearner);
  const progress = useAppSelector(selectAllProgress);

  // Percent is derived here rather than stored, so it cannot drift from the curriculum.
  const progressFor = (courseId) => {
    const entry = progress[courseId];
    if (!entry) return null;
    const course = VIDEO_COURSES.find((c) => c.id === courseId);
    if (!course) return null;
    const lessons = flattenCurriculum(buildCurriculum(course));
    const done = lessons.filter((l) => entry.lessons?.[l.id]?.status === 'complete').length;
    return { percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
  };

  const picks = recommendCourses({
    courses: VIDEO_COURSES,
    levels: learner.levels,
    progressFor,
    languageId,
    limit,
  });

  if (!picks.length) return null;

  const placedCount = Object.keys(learner.levels).length;

  return (
    <section className={className}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{heading ?? 'Recommended for you'}</h2>
          <p className="mt-1 text-sm text-muted">
            {placedCount
              ? 'Based on your placement result. Retake the test any time and this list moves with you.'
              : 'Take the free placement test and these become specific to your level.'}
          </p>
        </div>
        <Link to="/dashboard/courses" className="link-arrow">
          My courses
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>

      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {picks.map(({ course, reason, percent, started }) => (
          <li key={course.id}>
            <Link
              to={`/interactive-learning/${course.id}`}
              className="surface-card group flex h-full flex-col p-5 transition-shadow hover:shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={reason === REASONS.CONTINUE ? 'palm' : 'neutral'}>
                  {reasonText(reason)}
                </Badge>
                <LevelBadge code={course.level} showName={false} />
                {course.isOpen && <Badge tone="neutral">Open</Badge>}
              </div>

              <h3 className="mt-3 font-display text-md font-semibold leading-snug text-fg transition-colors group-hover:text-brand">
                {course.title}
              </h3>

              <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                <Flag iso={course.iso} size="xs" />
                {course.languageName}
                <span className="text-faint">·</span>
                <span className="nums">{course.lessonCount} lessons</span>
                <span className="text-faint">·</span>
                <span className="nums">{formatDuration(course.totalMinutes)}</span>
              </p>

              {started && (
                <div className="mt-auto pt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                    <div
                      className={cx('h-full rounded-full bg-brand transition-all')}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="nums mt-1.5 text-2xs text-faint">{percent}% complete</p>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
