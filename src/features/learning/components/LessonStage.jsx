import { useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import VideoThumb from '@/components/common/VideoThumb';
import QuestionCard from '@/features/placement/components/QuestionCard';
import WritingTask from '@/features/placement/components/WritingTask';
import SpeakingTask from '@/features/placement/components/SpeakingTask';
import MatchGame from '@/features/learning/components/MatchGame';
import { LESSON_TYPES, QUIZ_MODES, TASK_BASIS } from '@/services/mock/courseContent';
import ConversationPlayer from '@/features/learning/components/ConversationPlayer';
import { isTranscribable } from '@/lib/groqAssessment';
import { cx } from '@/lib/format';

/**
 * Renders one lesson, whatever kind it is, and reports back when it is finished.
 *
 * The quiz kinds reuse the placement components outright: a writing quiz inside a course
 * and a writing task inside the placement test are the same interaction with a different
 * consequence, so they should not be two implementations that drift apart.
 */
export default function LessonStage({ lesson, course, onComplete }) {
  switch (lesson.type) {
    case LESSON_TYPES.VIDEO:
      return <VideoLesson lesson={lesson} course={course} onComplete={onComplete} />;
    case LESSON_TYPES.AUDIO:
      return <AudioLesson lesson={lesson} onComplete={onComplete} />;
    case LESSON_TYPES.READING:
      return <ReadingLesson lesson={lesson} onComplete={onComplete} />;
    case LESSON_TYPES.GAME:
      return <GameLesson lesson={lesson} onComplete={onComplete} />;
    case LESSON_TYPES.QUIZ:
      return <QuizLesson lesson={lesson} course={course} onComplete={onComplete} />;
    default:
      return null;
  }
}

const TYPE_META = {
  video: { label: 'Watch', icon: 'video' },
  audio: { label: 'Listen', icon: 'headphones' },
  reading: { label: 'Read', icon: 'book' },
  quiz: { label: 'Practise', icon: 'target' },
  game: { label: 'Play', icon: 'sparkles' },
};

function LessonHeader({ lesson, extra }) {
  const meta = TYPE_META[lesson.type];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="clay">
          <Icon name={meta.icon} className="h-3 w-3" />
          {meta.label}
        </Badge>
        <span className="text-2xs text-muted">{lesson.minutes} min</span>
        {extra}
      </div>
      <h1 className="mt-3 text-balance text-xl font-semibold sm:text-2xl">{lesson.title}</h1>
    </div>
  );
}

/* --------------------------------------------------------------------- video */

function VideoLesson({ lesson, course, onComplete }) {
  const [watched, setWatched] = useState(false);

  return (
    <div className="animate-fade-up">
      <LessonHeader lesson={lesson} />

      <div className="mt-5">
        {lesson.video?.source ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video controls src={lesson.video.source} className="w-full rounded-xl" />
        ) : (
          <VideoThumb
            seed={lesson.id}
            label={course.languageName}
            caption={lesson.title}
            iso={course.iso}
          />
        )}
      </div>

      {!lesson.video?.source && (
        <p className="mt-2 text-2xs text-muted">
          Filming is not done for this lesson yet. The transcript below is the content.
        </p>
      )}

      {lesson.video?.transcript && (
        <div className="mt-5 rounded-xl border border-line bg-subtle p-4">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
            Transcript
          </p>
          <p className="mt-2 text-sm leading-relaxed text-fg">{lesson.video.transcript}</p>
        </div>
      )}

      <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          checked={watched}
          onChange={(e) => setWatched(e.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        I have watched this
      </label>

      <Button className="mt-4" disabled={!watched} onClick={() => onComplete({ watched: true })}>
        Mark complete
        <Icon name="arrowRight" className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* --------------------------------------------------------------------- audio */

function AudioLesson({ lesson, onComplete }) {
  const [heard, setHeard] = useState([]);
  const conversation = lesson.audio?.conversation;
  const phrases = lesson.audio?.phrases ?? [];
  const allHeard = phrases.length > 0 && heard.length === phrases.length;

  // A conversation between two people is a different lesson from a phrase drill: the
  // learner is listening for meaning, and what follows is a question about what was said.
  if (conversation) {
    return (
      <div className="animate-fade-up">
        <LessonHeader lesson={lesson} extra={<Badge tone="neutral">Listening</Badge>} />
        <p className="mt-2 text-muted">{lesson.audio.instruction}</p>
        <div className="mt-5">
          <ConversationPlayer
            conversation={conversation}
            listened={false}
            onListened={() => onComplete({ conversationId: conversation.id })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <LessonHeader lesson={lesson} />
      <p className="mt-2 text-muted">{lesson.audio?.instruction}</p>

      <ul className="mt-5 space-y-2">
        {phrases.map((phrase) => {
          const done = heard.includes(phrase.term);
          return (
            <li key={phrase.term}>
              <button
                type="button"
                onClick={() =>
                  setHeard((list) =>
                    list.includes(phrase.term)
                      ? list.filter((t) => t !== phrase.term)
                      : [...list, phrase.term],
                  )
                }
                className={cx(
                  'flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors',
                  done
                    ? 'border-brand bg-brand-soft'
                    : 'border-line bg-surface hover:border-line-strong',
                )}
              >
                <span>
                  <span className="block font-display text-lg font-semibold text-fg">
                    {phrase.term}
                  </span>
                  <span className="block text-sm text-muted">{phrase.meaning}</span>
                </span>
                <span className="shrink-0 text-2xs font-semibold text-muted">
                  {done ? 'said it' : 'say it back'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-2xs text-muted">
        Audio recordings are not attached yet — say each line aloud from the text, which is
        what the drill is for anyway.
      </p>

      <Button className="mt-4" disabled={!allHeard} onClick={() => onComplete({ phrases: heard.length })}>
        {allHeard ? 'Mark complete' : `Say all ${phrases.length} back to continue`}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------- reading */

function ReadingLesson({ lesson, onComplete }) {
  const [showGloss, setShowGloss] = useState(false);
  const gloss = lesson.reading?.gloss;

  return (
    <div className="animate-fade-up">
      <LessonHeader
        lesson={lesson}
        extra={lesson.reading?.passage ? <Badge tone="neutral">Reading</Badge> : null}
      />
      {lesson.reading?.instruction && (
        <p className="mt-2 text-muted">{lesson.reading.instruction}</p>
      )}

      <div className="mt-5 space-y-3">
        {lesson.reading?.body.map((paragraph, index) => (
          <div key={paragraph}>
            <p className="text-md leading-relaxed text-fg">{paragraph}</p>
            {/* Line-for-line English, off by default: reading the translation alongside
                is not reading the passage. */}
            {showGloss && gloss?.[index] && (
              <p className="mt-1 text-sm italic text-muted">{gloss[index]}</p>
            )}
          </div>
        ))}
      </div>

      {gloss?.length > 0 && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowGloss((v) => !v)}>
          {showGloss ? 'Hide English' : 'Show English'}
        </Button>
      )}

      {lesson.reading?.glossary?.length > 0 && (
        <div className="mt-6 rounded-xl border border-line bg-subtle p-4">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
            Words from this passage
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {lesson.reading.glossary.map((item) => (
              <div key={item.term} className="flex items-baseline justify-between gap-3">
                <dt className="font-display font-semibold text-fg">{item.term}</dt>
                <dd className="text-sm text-muted">{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <Button className="mt-5" onClick={() => onComplete({ read: true })}>
        Mark complete
        <Icon name="arrowRight" className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ---------------------------------------------------------------------- game */

function GameLesson({ lesson, onComplete }) {
  return (
    <div className="animate-fade-up">
      <LessonHeader lesson={lesson} />
      <p className="mt-2 text-muted">{lesson.game?.instruction}</p>
      <div className="mt-5">
        <MatchGame pairs={lesson.game?.pairs ?? []} onFinish={onComplete} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- quiz */

/**
 * What the task is about, shown above it.
 *
 * A comprehension question is unanswerable if the learner cannot get back to the material,
 * and making them navigate backwards to re-read a passage is how a good task becomes an
 * annoying one. The conversation transcript stays collapsed by default here for the same
 * reason it does in the lesson itself.
 */
function TaskSource({ source }) {
  const [open, setOpen] = useState(false);
  if (!source) return null;

  const label =
    source.kind === TASK_BASIS.CONVERSATION
      ? 'About the conversation you just heard'
      : source.kind === TASK_BASIS.READING
        ? 'About the passage you just read'
        : 'About the video you just watched';

  return (
    <div className="mt-4 rounded-xl border border-line bg-subtle p-4">
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-fg">{source.title}</p>

      {source.transcript && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            <Icon
              name="chevronDown"
              className={cx('h-3.5 w-3.5 transition-transform', open && '-rotate-180')}
            />
            {open ? 'Hide it' : 'Look at it again'}
          </button>
          {open && (
            <pre className="mt-3 whitespace-pre-wrap font-display text-sm leading-relaxed text-muted">
              {source.transcript}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

function QuizLesson({ lesson, course, onComplete }) {
  const quiz = lesson.quiz;
  const [answers, setAnswers] = useState({});
  const [writing, setWriting] = useState('');
  const [recording, setRecording] = useState(null);
  const [checked, setChecked] = useState(false);

  const questions = quiz?.questions ?? [];
  const score = useMemo(
    () => questions.filter((q) => answers[q.id] === q.answerId).length,
    [questions, answers],
  );

  if (quiz?.mode === QUIZ_MODES.WRITE) {
    const comprehension = quiz.basis === TASK_BASIS.CONVERSATION;

    return (
      <div className="animate-fade-up">
        <LessonHeader
          lesson={lesson}
          extra={<Badge tone="neutral">{comprehension ? 'Listening → writing' : 'Written'}</Badge>}
        />

        <TaskSource source={quiz.source} />

        {quiz.prompt?.question && (
          <div className="mt-4">
            <p className="font-display text-lg font-semibold text-fg">{quiz.prompt.question}</p>
            {quiz.prompt.questionGloss && (
              <p className="mt-1 text-sm italic text-muted">{quiz.prompt.questionGloss}</p>
            )}
          </div>
        )}

        <div className="mt-4">
          <WritingTask
            prompt={quiz.prompt}
            value={writing}
            onChange={setWriting}
            onSkip={() => onComplete({ skipped: true })}
          />
        </div>
        <Button
          className="mt-5"
          disabled={writing.trim().length < 8}
          onClick={() =>
            onComplete({
              writingResponse: writing,
              basis: quiz.basis,
              sourceId: quiz.source?.conversationId ?? quiz.source?.lessonId ?? null,
              needsReview: true,
            })
          }
        >
          Submit for feedback
        </Button>
        <p className="mt-2 text-2xs text-muted">
          {comprehension
            ? 'Marked on two things: whether you understood the conversation, and how you wrote it. Only the second can move your level.'
            : 'Checked by a language model, then confirmed by your teacher.'}
        </p>
      </div>
    );
  }

  if (quiz?.mode === QUIZ_MODES.SPEAK) {
    const fromReading = quiz.basis === TASK_BASIS.READING;

    return (
      <div className="animate-fade-up">
        <LessonHeader
          lesson={lesson}
          extra={<Badge tone="neutral">{fromReading ? 'Reading → speaking' : 'Spoken'}</Badge>}
        />

        <TaskSource source={quiz.source} />

        {quiz.prompt?.guidingQuestions?.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {quiz.prompt.guidingQuestions.map((question) => (
              <li key={question} className="flex gap-2.5 text-sm text-muted">
                <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {question}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <SpeakingTask
            prompt={quiz.prompt}
            recording={recording}
            transcribable={isTranscribable(course.languageId)}
            onRecorded={setRecording}
            onSkip={() => onComplete({ skipped: true })}
          />
        </div>
        <Button
          className="mt-5"
          disabled={!recording}
          onClick={() =>
            onComplete({
              recording,
              basis: quiz.basis,
              sourceId: quiz.source?.passageId ?? quiz.source?.lessonId ?? null,
              needsReview: true,
            })
          }
        >
          Submit recording
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <LessonHeader lesson={lesson} extra={<Badge tone="neutral">Multiple choice</Badge>} />

      <div className="mt-5 space-y-8">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            value={answers[question.id]}
            onAnswer={(optionId) =>
              setAnswers((a) => ({ ...a, [question.id]: optionId }))
            }
            index={index}
            total={questions.length}
          />
        ))}
      </div>

      {checked && (
        <div className="mt-6 rounded-xl border border-line bg-subtle p-4">
          <p className="nums text-sm font-semibold text-fg">
            {score} of {questions.length} correct
          </p>
          <ul className="mt-2 space-y-1.5">
            {questions
              .filter((q) => answers[q.id] !== q.answerId)
              .map((q) => (
                <li key={q.id} className="text-sm text-muted">
                  <span className="font-semibold text-fg">
                    {q.options.find((o) => o.id === q.answerId)?.label}
                  </span>
                  {q.note ? ` — ${q.note}` : ''}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {!checked ? (
          <Button
            disabled={Object.keys(answers).length < questions.length}
            onClick={() => setChecked(true)}
          >
            Check my answers
          </Button>
        ) : (
          <>
            <Button onClick={() => onComplete({ score, total: questions.length })}>
              Continue
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setChecked(false);
              }}
            >
              Try again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
