import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import LevelBadge from '@/components/common/LevelBadge';
import { cx } from '@/lib/format';
import { useGetCourseQuery } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import { recordPlacement } from '@/features/learner/learnerSlice';
import {
  enrol,
  openLesson,
  completeLesson,
  recordCheckpoint,
  selectCourseProgress,
} from '@/features/learning/progressSlice';
import { buildCurriculum, flattenCurriculum } from '@/services/mock/courseContent';
import LessonStage from '@/features/learning/components/LessonStage';
import Checkpoint from '@/features/learning/components/Checkpoint';
import { PlacementRequiredScreen } from '@/features/placement/components/PlacementGate';
import { usePlacementGate } from '@/features/placement/usePlacementGate';
import SubscriptionGate from '@/features/payments/components/SubscriptionGate';
import { selectHasSubscription } from '@/features/payments/subscriptionSlice';

/**
 * The Interactive Learning player.
 *
 * Syllabus on the left, one lesson at a time on the right. The learner is never shown a
 * bare percentage — they are shown which lesson is next, because that is the question
 * someone returning after two weeks is actually asking.
 */
export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const progress = useAppSelector(selectCourseProgress(courseId));

  const { data: course, isFetching } = useGetCourseQuery(courseId);
  const gate = usePlacementGate(course?.languageId);
  const subscribed = useAppSelector(selectHasSubscription);
  // An open course needs no plan; everything else does. Placement is checked first
  // because a level is required before learning at all, subscription or not.
  const needsPlan = Boolean(course) && !course.isOpen && !subscribed;
  const [activeId, setActiveId] = useState(null);
  const [checkpointId, setCheckpointId] = useState(null);

  const modules = useMemo(() => (course ? buildCurriculum(course) : []), [course]);
  const lessons = useMemo(() => flattenCurriculum(modules), [modules]);

  // Enrol on arrival - but only once the learner is actually allowed to be here.
  useEffect(() => {
    if (courseId && course && !gate.required && !needsPlan) dispatch(enrol(courseId));
  }, [courseId, course, gate.required, needsPlan, dispatch]);

  // Resume where they left off, or start at the beginning.
  useEffect(() => {
    if (!lessons.length || activeId) return;
    const resume =
      progress?.lastLessonId && lessons.some((l) => l.id === progress.lastLessonId)
        ? progress.lastLessonId
        : lessons.find((l) => progress?.lessons?.[l.id]?.status !== 'complete')?.id ??
          lessons[0].id;
    setActiveId(resume);
  }, [lessons, progress, activeId]);

  useEffect(() => {
    if (courseId && activeId) dispatch(openLesson({ courseId, lessonId: activeId }));
  }, [courseId, activeId, dispatch]);

  if (isFetching || !course) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // The last line of defence: there is nothing useful behind this gate, so it replaces
  // the page rather than sitting on top of it.
  if (gate.required) {
    return (
      <PlacementRequiredScreen
        language={{ id: course.languageId, name: course.languageName }}
        action="open a course"
        backTo={`/interactive-learning/${courseId}`}
        backLabel="Back to the course overview"
      />
    );
  }

  // Placed, but not subscribed. Same treatment as the placement gate: replace the page
  // rather than overlay it, because there is nothing usable behind it.
  if (needsPlan) {
    return (
      <div className="mx-auto max-w-3xl">
        <SubscriptionGate courseName={course.title} />
        <Link
          to={`/interactive-learning/${courseId}`}
          className="link-arrow mt-6 inline-flex"
        >
          Back to the course overview
        </Link>
      </div>
    );
  }

  const completed = lessons.filter((l) => progress?.lessons?.[l.id]?.status === 'complete');
  const percent = lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0;
  const activeIndex = lessons.findIndex((l) => l.id === activeId);
  const active = lessons[activeIndex];
  const activeModule = modules.find((m) => m.id === active?.moduleId);

  const finishLesson = (result) => {
    dispatch(completeLesson({ courseId, lessonId: active.id, result }));

    // A module boundary with a checkpoint is where assessment happens mid-journey.
    const isLastOfModule =
      activeModule?.lessons[activeModule.lessons.length - 1]?.id === active.id;

    if (isLastOfModule && activeModule?.checkpoint?.questions?.length) {
      setCheckpointId(activeModule.checkpoint.id);
      return;
    }
    goNext();
  };

  const goNext = () => {
    setCheckpointId(null);
    const next = lessons[activeIndex + 1];
    if (next) setActiveId(next.id);
    else navigate(`/interactive-learning/${courseId}`);
  };

  const checkpoint = checkpointId
    ? modules.find((m) => m.checkpoint?.id === checkpointId)?.checkpoint
    : null;

  return (
    <div className="-mx-4 -my-8 sm:-mx-6">
      {/* ------------------------------------------------------------- header */}
      <header className="border-b border-line bg-surface px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/interactive-learning/${courseId}`}
              className="link-arrow mb-1 inline-flex"
            >
              <Icon name="arrowLeft" className="h-3.5 w-3.5" />
              Course overview
            </Link>
            <h1 className="truncate text-lg font-semibold">{course.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LevelBadge code={course.level} showName={false} />
            <div className="w-32">
              <div className="mb-1 flex justify-between text-2xs font-semibold text-muted">
                <span>{completed.length}/{lessons.length}</span>
                <span className="nums text-brand">{percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* ---------------------------------------------------------- syllabus */}
        <aside className="border-b border-line bg-surface px-4 py-4 sm:px-6 lg:sticky lg:top-14 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="mb-5 last:mb-0">
              <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
                {moduleIndex + 1}. {module.title}
              </p>
              <ul className="space-y-0.5">
                {module.lessons.map((lesson) => {
                  const state = progress?.lessons?.[lesson.id]?.status;
                  const isActive = lesson.id === activeId;
                  return (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckpointId(null);
                          setActiveId(lesson.id);
                        }}
                        className={cx(
                          'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-brand-soft font-semibold text-brand'
                            : 'text-muted hover:bg-subtle hover:text-fg',
                        )}
                      >
                        <span
                          className={cx(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                            state === 'complete'
                              ? 'border-brand bg-brand text-brand-fg'
                              : 'border-line-strong',
                          )}
                        >
                          {state === 'complete' && (
                            <Icon name="check" className="h-2.5 w-2.5" strokeWidth={4} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        <span className="shrink-0 text-2xs text-faint">{lesson.minutes}m</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {module.checkpoint?.questions?.length > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 px-2.5 text-2xs text-faint">
                  <Icon name="target" className="h-3 w-3" />
                  Checkpoint
                </p>
              )}
            </div>
          ))}
        </aside>

        {/* ------------------------------------------------------------- stage */}
        <main className="px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-2xl">
            {checkpoint ? (
              <Checkpoint
                checkpoint={checkpoint}
                course={course}
                onDone={({ correct, total, level }) => {
                  dispatch(
                    recordCheckpoint({
                      courseId,
                      checkpointId: checkpoint.id,
                      correct,
                      total,
                      level,
                    }),
                  );
                  // A checkpoint is a placement: it moves the learner's level mid-course.
                  if (level) {
                    dispatch(
                      recordPlacement({
                        languageId: course.languageId,
                        languageName: course.languageName,
                        level,
                        mode: 'checkpoint',
                        confidence: 'medium',
                        skills: { vocabulary: { correctCount: correct, total } },
                      }),
                    );
                  }
                  goNext();
                }}
                onSkip={goNext}
              />
            ) : active ? (
              <>
                <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
                  {active.moduleTitle}
                </p>
                <LessonStage
                  key={active.id}
                  lesson={active}
                  course={course}
                  onComplete={finishLesson}
                />

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
                  <Button
                    variant="ghost"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveId(lessons[activeIndex - 1].id)}
                  >
                    <Icon name="arrowLeft" className="h-4 w-4" />
                    Previous
                  </Button>
                  <Badge tone="neutral">
                    Lesson {activeIndex + 1} of {lessons.length}
                  </Badge>
                  <Button variant="ghost" onClick={goNext}>
                    Skip
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : null}

            {percent === 100 && (
              <div className="mt-8 rounded-xl border border-brand-border bg-brand-soft p-5 text-center">
                <Icon name="certificate" className="mx-auto h-7 w-7 text-brand" />
                <p className="mt-2 font-display text-lg font-semibold text-fg">
                  Course complete
                </p>
                <p className="mt-1 text-sm text-muted">
                  Well done, {user?.displayName?.split(' ')[0]}. Your certificate will appear
                  in your dashboard once certificates are wired up.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
