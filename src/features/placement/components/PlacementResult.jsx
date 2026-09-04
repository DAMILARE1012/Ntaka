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
        <li key={item.id} className="py-3.5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
            <LevelBadge code={item.level} showName={false} />
            {item.prompt}
          </p>
          <p className="mt-1 text-sm">
            <span
              className={cx(
                'font-semibold',
                item.correct ? 'text-brand' : 'text-danger',
              )}
            >
              {item.correct ? 'Correct' : 'Not quite'}
            </span>
            {!item.correct && (
              <>
                <span className="text-muted"> — the answer is </span>
                <span className="font-semibold text-fg">{item.answerLabel}</span>
                {item.note && <span className="text-muted">. {item.note}</span>}
              </>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

/**
 * One measured skill. `scored` false is not a failure - it means we captured the answer
 * but do not claim to grade it, which is true of every spoken recording.
 */
function SkillLine({ label, value, scored, partial }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-ink-200">
        <Icon
          name={scored ? 'check' : 'clock'}
          className={cx('h-3.5 w-3.5', scored ? 'text-leaf-300' : 'text-ink-400')}
          strokeWidth={2.5}
        />
        {label}
        {partial && scored && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-2xs">partial</span>
        )}
      </span>
      <span className="text-right text-ink-100">{value}</span>
    </li>
  );
}

/** The end of the placement flow: level, evidence, and the three ways to act on it. */
export default function PlacementResult({ result, onRestart, returnTo }) {
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
              {/* Arriving from a gate means they were part-way through something. Send
                  them back to it rather than making them find it again. */}
              {returnTo ? (
                <Button to={returnTo} size="lg">
                  Carry on where you left off
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
              ) : (
                <Button to={`/teachers?language=${result.languageId}`} size="lg">
                  Book a trial lesson
                </Button>
              )}
              <Button variant="light" size="lg" onClick={onRestart}>
                Retake the check
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-300">
              How we placed you
            </p>

            <ul className="mt-3 space-y-2.5">
              <SkillLine
                label="Vocabulary"
                value={
                  result.skills?.vocabulary
                    ? `${result.skills.vocabulary.correctCount}/${result.skills.vocabulary.total} correct`
                    : 'Not available in this language yet'
                }
                scored={Boolean(result.skills?.vocabulary)}
              />
              <SkillLine
                label="Writing"
                value={
                  result.skills?.writing?.attempted
                    ? `${result.skills.writing.signals.wordCount} words, ${result.skills.writing.signals.sentenceCount} sentences`
                    : 'Skipped'
                }
                scored={result.skills?.writing?.attempted}
                partial
              />
              <SkillLine
                label="Speaking"
                value={
                  result.skills?.speaking?.attempted
                    ? `${result.skills.speaking.totalSeconds}s recorded`
                    : 'Skipped'
                }
                scored={false}
              />
            </ul>

            {result.reasons?.length > 0 && (
              <p className="mt-3 rounded-xl bg-gold-400/20 p-3 text-sm text-gold-100">
                {result.reasons.join(' ')}
              </p>
            )}

            {result.pendingReview?.length > 0 && (
              <p className="mt-3 text-xs text-ink-300">
                Your {result.pendingReview.join(' and ')} {result.pendingReview.length > 1 ? 'are' : 'is'}{' '}
                passed to your first teacher. Pronunciation and grammar are judged by a person,
                not by an algorithm.
              </p>
            )}

            <p className="mt-4 text-xs text-ink-300">
              Confidence: {result.confidence}. Estimated time to the next level: {level.hours}
            </p>
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
          <h2 className="text-lg font-semibold">Self-paced interactive courses to start today</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {result.recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- your answers */}
      {result.skills?.vocabulary && (
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
