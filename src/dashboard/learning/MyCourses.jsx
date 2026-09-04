import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import LevelBadge from '@/components/common/LevelBadge';
import Flag from '@/components/common/Flag';
import { cx, formatDuration } from '@/lib/format';
import { useAppSelector } from '@/app/hooks';
import { selectAllProgress } from '@/features/learning/progressSlice';
import { VIDEOS_BY_ID } from '@/services/mock/videos';
import { buildCurriculum, flattenCurriculum } from '@/services/mock/courseContent';
import { PageTitle, Panel, StatTile, ComingSoon } from '@/dashboard/components/Panel';

/**
 * Courses the learner has opened, with where they stopped.
 *
 * Sorted by most recently touched, because the question someone opens this page with is
 * "what was I doing?", not "what have I collected?".
 */
export default function MyCourses() {
  const progress = useAppSelector(selectAllProgress);

  const rows = Object.values(progress)
    .map((entry) => {
      const course = VIDEOS_BY_ID[entry.courseId];
      if (!course) return null;

      const lessons = flattenCurriculum(buildCurriculum(course));
      const done = lessons.filter((l) => entry.lessons?.[l.id]?.status === 'complete');
      const next =
        lessons.find((l) => entry.lessons?.[l.id]?.status !== 'complete') ?? null;

      return {
        entry,
        course,
        total: lessons.length,
        done: done.length,
        percent: lessons.length ? Math.round((done.length / lessons.length) * 100) : 0,
        next,
        checkpoints: Object.keys(entry.checkpoints ?? {}).length,
        touchedAt: Object.values(entry.lessons ?? {}).reduce(
          (latest, l) => (l.completedAt > latest ? l.completedAt : latest),
          entry.enrolledAt,
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.touchedAt) - new Date(a.touchedAt));

  const finished = rows.filter((r) => r.percent === 100).length;
  const minutesDone = rows.reduce((n, r) => n + r.done * 8, 0);

  return (
    <>
      <PageTitle
        title="My courses"
        description="Interactive Learning — video, audio, quizzes and games at your own pace."
        action={<Button to="/interactive-learning">Browse all courses</Button>}
      />

      {rows.length === 0 ? (
        <Panel>
          <ComingSoon
            title="You have not started a course yet"
            body="Interactive courses mix video, listening drills, quizzes and games. Pick one at your level and it will show up here with your progress."
            cta={{ to: '/interactive-learning', label: 'Find a course' }}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="In progress" value={rows.length - finished} icon="video" tone="brand" />
            <StatTile label="Completed" value={finished} icon="certificate" />
            <StatTile
              label="Time invested"
              value={formatDuration(minutesDone)}
              sub="approximate"
              icon="clock"
            />
          </div>

          <div className="mt-6 space-y-4">
            {rows.map((row) => (
              <Panel key={row.course.id}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Flag iso={row.course.iso} size="xs" />
                      <LevelBadge code={row.course.level} showName={false} />
                      {row.checkpoints > 0 && (
                        <span className="text-2xs font-semibold text-brand">
                          {row.checkpoints} checkpoint{row.checkpoints > 1 ? 's' : ''} passed
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/dashboard/learn/${row.course.id}`}
                      className="mt-1.5 block font-display text-lg font-semibold text-fg hover:text-brand"
                    >
                      {row.course.title}
                    </Link>

                    <p className="mt-1 text-sm text-muted">
                      {row.next ? (
                        <>
                          Next up: <span className="text-fg">{row.next.title}</span>
                        </>
                      ) : (
                        'Every lesson complete.'
                      )}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-line">
                        <div
                          className={cx(
                            'h-full rounded-full transition-[width]',
                            row.percent === 100 ? 'bg-brand' : 'bg-brand/70',
                          )}
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <span className="nums text-2xs font-semibold text-muted">
                        {row.done}/{row.total} · {row.percent}%
                      </span>
                    </div>
                  </div>

                  <Button to={`/dashboard/learn/${row.course.id}`} size="sm">
                    {row.percent === 0 ? 'Start' : row.percent === 100 ? 'Review' : 'Resume'}
                    <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
    </>
  );
}
