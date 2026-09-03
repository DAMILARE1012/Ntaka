import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import LevelLadder from '@/components/common/LevelLadder';
import LevelBadge from '@/components/common/LevelBadge';
import TeacherMiniCard from '@/features/teachers/components/TeacherMiniCard';
import ClassCard from '@/features/classes/components/ClassCard';
import CourseCard from '@/features/videos/components/CourseCard';
import { getLevel } from '@/lib/cefr';
import { cx } from '@/lib/format';

function ScoreDial({ score, max }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#E45C2B ${pct * 3.6}deg, #E9E0D3 ${pct * 3.6}deg)`,
        }}
      >
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-surface">
          <span className="font-display text-lg font-semibold text-fg">{score}</span>
          <span className="text-2xs font-semibold text-faint">of {max}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-fg">Placement score</p>
        <p className="text-sm text-muted">Weighted by the level each question tests</p>
      </div>
    </div>
  );
}

function AnswerReview({ breakdown }) {
  return (
    <ol className="divide-y divide-line">
      {breakdown.map((item) => (
        <li key={item.id} className="flex gap-3 py-3.5">
          <span
            className={cx(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
              item.correct ? 'bg-brand-soft text-brand' : 'bg-brand-soft text-brand-hover',
            )}
          >
            <Icon
              name={item.correct ? 'check' : 'close'}
              className="h-3 w-3"
              strokeWidth={3}
            />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
              <LevelBadge code={item.level} showName={false} />
              {item.prompt}
            </p>
            {!item.correct && (
              <p className="mt-1 text-sm text-muted">
                Answer: <span className="font-semibold text-fg">{item.answerLabel}</span>
                {item.note && <span className="text-muted"> — {item.note}</span>}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The end of the placement flow: level, evidence, and the three ways to act on it. */
export default function PlacementResult({ result, onRestart }) {
  const level = getLevel(result.level);

  return (
    <div className="animate-fade-up space-y-10">
      {/* ------------------------------------------------------------ verdict */}
      <section className="overflow-hidden rounded-3xl bg-ink-950 text-white">
        <div className="brand-rule" />
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Badge tone="white">Free placement result</Badge>
            <h1 className="mt-4 text-balance font-display text-2xl font-semibold sm:text-3xl">
              You are starting {result.languageName} at{' '}
              <span className="text-gold-300">
                {level.code} · {level.name}
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-ink-200">{level.summary}</p>

            <ul className="mt-6 space-y-2">
              {level.canDo.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-200">
                  <Icon
                    name="check"
                    className="mt-0.5 h-4 w-4 shrink-0 text-leaf-300"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button to={`/teachers?language=${result.languageId}`} size="lg">
                Book a trial lesson
              </Button>
              <Button variant="light" size="lg" onClick={onRestart}>
                Retake the check
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              How we placed you
            </p>
            {result.mode === 'quiz' ? (
              <>
                <p className="mt-3 text-sm text-ink-200">
                  You answered{' '}
                  <span className="font-semibold text-white">
                    {result.correctCount} of {result.totalQuestions}
                  </span>{' '}
                  questions correctly, weighted by difficulty.
                </p>
                {result.confidence === 'adjusted' && (
                  <p className="mt-3 rounded-xl bg-gold-400/20 p-3 text-sm text-gold-100">
                    Your self-assessment was well ahead of the written quiz, so we nudged you up one
                    level. This is common for heritage speakers who understand far more than they
                    read.
                  </p>
                )}
                <p className="mt-4 text-xs text-ink-300">
                  Estimated time to the next level: {level.hours}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-200">
                {result.languageName} does not have a graded quiz yet, so this placement comes from
                your own can-do check. Your first teacher will confirm it in the trial lesson.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- ladder */}
      <section>
        <h2 className="text-lg font-semibold">Where {level.code} sits on the CEFR ladder</h2>
        <p className="mt-2 text-muted">
          Ntaka teaches to the six CEFR levels, so every teacher, class and course means the same
          thing by “intermediate”.
        </p>
        <LevelLadder current={result.level} className="mt-6" />
      </section>

      {/* ---------------------------------------------------------- next step */}
      {result.recommendedTeachers?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Teachers who take learners at {level.code}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.recommendedTeachers.map((teacher) => (
              <TeacherMiniCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </section>
      )}

      {result.recommendedClasses?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Group classes at your level</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {result.recommendedClasses.map((groupClass) => (
              <ClassCard key={groupClass.id} groupClass={groupClass} />
            ))}
          </div>
        </section>
      )}

      {result.recommendedCourses?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Self-paced video courses to start today</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {result.recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- your answers */}
      {result.mode === 'quiz' && (
        <section className="surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <h2 className="text-lg font-semibold">Your answers</h2>
            <ScoreDial score={result.score} max={result.maxScore} />
          </div>
          <div className="mt-5">
            <AnswerReview breakdown={result.breakdown} />
          </div>
        </section>
      )}
    </div>
  );
}
