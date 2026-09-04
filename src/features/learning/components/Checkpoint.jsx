import { useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import LevelBadge from '@/components/common/LevelBadge';
import QuestionCard from '@/features/placement/components/QuestionCard';
import { LEVEL_CODES, levelIndex } from '@/lib/cefr';

/**
 * A short assessment at a module boundary.
 *
 * The point of this is that placement stops being a one-off gate. A learner who improves
 * halfway through a course should be re-levelled there and then, so the teachers and
 * classes recommended to them move with them.
 *
 * It is deliberately short and skippable. A checkpoint that feels like an exam turns a
 * course into a chore, and a learner who abandons the course learns nothing at all.
 */
export default function Checkpoint({ checkpoint, course, onDone, onSkip }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = checkpoint.questions ?? [];
  const correct = useMemo(
    () => questions.filter((q) => answers[q.id] === q.answerId).length,
    [questions, answers],
  );

  /**
   * Only move a level on a clear result. Two out of three is noise; all correct at this
   * course's level is evidence they have outgrown it, and none correct suggests the
   * course is pitched too high.
   */
  const suggestedLevel = useMemo(() => {
    if (!questions.length) return null;
    const ratio = correct / questions.length;
    const current = levelIndex(course.level);
    if (ratio === 1 && current < LEVEL_CODES.length - 1) return LEVEL_CODES[current + 1];
    if (ratio === 0 && current > 0) return LEVEL_CODES[current - 1];
    return null;
  }, [correct, questions.length, course.level]);

  if (!questions.length) return null;

  if (submitted) {
    return (
      <div className="animate-fade-up text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon name="target" className="h-6 w-6" />
        </span>
        <h2 className="mt-3 text-xl font-semibold">Checkpoint done</h2>
        <p className="nums mt-1 text-sm text-muted">
          {correct} of {questions.length} correct
        </p>

        {suggestedLevel ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-soft px-4 py-2.5">
            <LevelBadge code={course.level} showName={false} />
            <Icon name="arrowRight" className="h-4 w-4 text-brand" />
            <LevelBadge code={suggestedLevel} showName={false} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Your level stays at {course.level} — that is exactly where this course is pitched.
          </p>
        )}

        <div className="mt-5">
          <Button
            onClick={() =>
              onDone({ correct, total: questions.length, level: suggestedLevel })
            }
          >
            Carry on with the course
            <Icon name="arrowRight" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="clay">
          <Icon name="target" className="h-3 w-3" />
          Checkpoint
        </Badge>
        <LevelBadge code={checkpoint.level} showName={false} />
        <span className="text-2xs text-muted">{questions.length} questions</span>
      </div>

      <h2 className="mt-3 text-balance text-xl font-semibold sm:text-2xl">
        {checkpoint.title}
      </h2>
      <p className="mt-2 text-muted">
        A quick check on what that module covered. It can move your level up or down, and
        the teachers and classes we suggest move with it.
      </p>

      <div className="mt-6 space-y-8">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]}
            onAnswer={(optionId) => setAnswers((a) => ({ ...a, [question.id]: optionId }))}
            index={index}
            total={questions.length}
          />
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Button
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Submit checkpoint
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
