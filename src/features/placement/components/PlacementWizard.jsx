import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useGetPlacementTestQuery, useSubmitPlacementMutation } from '@/services/api';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import LanguagePicker from '@/features/placement/components/LanguagePicker';
import QuestionCard from '@/features/placement/components/QuestionCard';
import SelfAssessment from '@/features/placement/components/SelfAssessment';
import PlacementResult from '@/features/placement/components/PlacementResult';
import { recordPlacement } from '@/features/learner/learnerSlice';
import {
  selectPlacement,
  chooseLanguage,
  answerBackground,
  answerQuestion,
  toggleSelfStatement,
  goToStage,
  next,
  back,
  setResult,
  restart,
} from '@/features/placement/placementSlice';
import { cx } from '@/lib/format';

const STAGE_ORDER = ['language', 'background', 'quiz', 'self', 'result'];

function ProgressBar({ stage, cursor, totalInStage }) {
  const stageIdx = STAGE_ORDER.indexOf(stage);
  const withinStage = totalInStage ? (cursor + 1) / totalInStage : 1;
  const pct = Math.min(100, ((stageIdx + withinStage) / STAGE_ORDER.length) * 100);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Orchestrates the free placement check.
 * The slice holds the answers; this component only decides which step to render next.
 */
export default function PlacementWizard() {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectPlacement);
  const { stage, languageId, cursor, background, answers, selfChecked, result } = state;

  const { data: test, isFetching } = useGetPlacementTestQuery(languageId, { skip: !languageId });
  const [submit, { isLoading: isSubmitting }] = useSubmitPlacementMutation();

  // Languages without a graded bank skip straight to the self-assessment.
  useEffect(() => {
    if (stage === 'quiz' && test && test.mode === 'self') {
      dispatch(goToStage('self'));
    }
  }, [stage, test, dispatch]);

  const finish = async () => {
    const payload = { languageId, answers, selfChecked, background };
    const data = await submit(payload).unwrap();
    dispatch(setResult(data));
    dispatch(recordPlacement({ languageId, level: data.level, mode: data.mode }));
  };

  /* ------------------------------------------------------------------ result */
  if (stage === 'result' && result) {
    return <PlacementResult result={result} onRestart={() => dispatch(restart())} />;
  }

  /* ---------------------------------------------------------------- language */
  if (stage === 'language') {
    return (
      <div>
        <StageHeader
          step="Step 1 of 4"
          title="Which language are you placing?"
          description="Pick a language and we will work out your CEFR level in about six minutes. No account, no card, no catch."
        />
        <LanguagePicker onChoose={(id) => dispatch(chooseLanguage(id))} />
      </div>
    );
  }

  if (isFetching || !test) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  /* -------------------------------------------------------------- background */
  if (stage === 'background') {
    const question = test.background[cursor];
    const answered = Boolean(background[question.id]);
    const isLast = cursor === test.background.length - 1;

    return (
      <WizardFrame
        step="Step 2 of 4"
        title={`A little about your ${test.languageName}`}
        stage={stage}
        cursor={cursor}
        total={test.background.length}
        onBack={cursor === 0 ? () => dispatch(restart()) : () => dispatch(back())}
        onNext={() => (isLast ? dispatch(goToStage('quiz')) : dispatch(next()))}
        nextDisabled={!answered}
        nextLabel={isLast ? 'Start the questions' : 'Next'}
      >
        <QuestionCard
          question={question}
          value={background[question.id]}
          onAnswer={(optionId) =>
            dispatch(answerBackground({ questionId: question.id, optionId }))
          }
          index={cursor}
          total={test.background.length}
        />
      </WizardFrame>
    );
  }

  /* -------------------------------------------------------------------- quiz */
  if (stage === 'quiz' && test.mode === 'quiz') {
    const question = test.questions[cursor];
    const answered = Boolean(answers[question.id]);
    const isLast = cursor === test.questions.length - 1;

    return (
      <WizardFrame
        step="Step 3 of 4"
        title={`${test.languageName} placement questions`}
        note="Guessing is fine — a wrong answer just tells us where to start."
        stage={stage}
        cursor={cursor}
        total={test.questions.length}
        onBack={cursor === 0 ? () => dispatch(goToStage('background')) : () => dispatch(back())}
        onNext={() => (isLast ? dispatch(goToStage('self')) : dispatch(next()))}
        nextDisabled={!answered}
        nextLabel={isLast ? 'Last step' : 'Next'}
      >
        <QuestionCard
          question={question}
          value={answers[question.id]}
          onAnswer={(optionId) => dispatch(answerQuestion({ questionId: question.id, optionId }))}
          index={cursor}
          total={test.questions.length}
          showLevel
        />
      </WizardFrame>
    );
  }

  /* --------------------------------------------------------- self-assessment */
  return (
    <WizardFrame
      step="Step 4 of 4"
      title="One last check"
      stage="self"
      cursor={0}
      total={1}
      onBack={() => dispatch(goToStage(test.mode === 'quiz' ? 'quiz' : 'background'))}
      onNext={finish}
      nextDisabled={isSubmitting}
      nextLabel={isSubmitting ? 'Working it out…' : 'See my level'}
    >
      <SelfAssessment
        checked={selfChecked}
        onToggle={(level) => dispatch(toggleSelfStatement(level))}
      />
    </WizardFrame>
  );
}

function StageHeader({ step, title, description, note }) {
  return (
    <div className="mb-8 text-center">
      <p className="eyebrow mb-3">{step}</p>
      <h1 className="text-balance text-2xl font-semibold sm:text-3xl">{title}</h1>
      {description && <p className="mx-auto mt-3 max-w-xl text-muted">{description}</p>}
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    </div>
  );
}

function WizardFrame({
  step,
  title,
  note,
  stage,
  cursor,
  total,
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  children,
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <StageHeader step={step} title={title} note={note} />
      <ProgressBar stage={stage} cursor={cursor} totalInStage={total} />

      <div className="mt-8">{children}</div>

      <div className={cx('mt-8 flex items-center justify-between gap-3')}>
        <Button variant="ghost" onClick={onBack}>
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={nextDisabled} size="lg">
          {nextLabel}
          <Icon name="arrowRight" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
