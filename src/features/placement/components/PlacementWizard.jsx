import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useGetPlacementTestQuery, useSubmitPlacementMutation } from '@/services/api';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import LanguagePicker from '@/features/placement/components/LanguagePicker';
import QuestionCard from '@/features/placement/components/QuestionCard';
import WritingTask from '@/features/placement/components/WritingTask';
import SpeakingTask from '@/features/placement/components/SpeakingTask';
import SelfAssessment from '@/features/placement/components/SelfAssessment';
import PlacementResult from '@/features/placement/components/PlacementResult';
import PlacementProgress from '@/features/placement/components/PlacementProgress';
import { isTranscribable } from '@/lib/groqAssessment';
import { recordPlacement } from '@/features/learner/learnerSlice';
import { selectUser } from '@/dashboard/auth/authSlice';
import {
  selectPlacement,
  chooseLanguage,
  answerBackground,
  answerQuestion,
  setWriting,
  setRecording,
  skipTask,
  toggleSelfStatement,
  goToStage,
  next,
  back,
  setResult,
  restart,
} from '@/features/placement/placementSlice';

/**
 * The placement check.
 *
 * Six stages: language, background, vocabulary, writing, speaking, self-check. Writing
 * and speaking are skippable by design — a learner on a machine with no microphone must
 * still be able to finish, and a partial result with an honest confidence beats no result.
 */
const STAGES = ['language', 'background', 'quiz', 'writing', 'speaking', 'self'];

export default function PlacementWizard() {
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const user = useAppSelector(selectUser);
  const state = useAppSelector(selectPlacement);
  const {
    stage,
    languageId,
    cursor,
    background,
    answers,
    writingResponse,
    recordings,
    selfChecked,
    skipped,
    result,
  } = state;

  const { data: test, isFetching } = useGetPlacementTestQuery(languageId, { skip: !languageId });
  const [submit, { isLoading: isSubmitting }] = useSubmitPlacementMutation();

  // Arriving from a gate: the language is already known, so skip choosing it.
  const requestedLanguage = params.get('language');
  const returnTo = params.get('returnTo');

  useEffect(() => {
    if (stage === 'language' && requestedLanguage && requestedLanguage !== languageId) {
      dispatch(chooseLanguage(requestedLanguage));
    }
  }, [stage, requestedLanguage, languageId, dispatch]);

  // Languages without a graded bank have nothing to show at the quiz stage.
  useEffect(() => {
    if (stage === 'quiz' && test && test.mode === 'self') {
      dispatch(goToStage('writing'));
    }
  }, [stage, test, dispatch]);

  const finish = async () => {
    const data = await submit({
      languageId,
      answers,
      selfChecked,
      background,
      writingResponse,
      recordings: Object.values(recordings),
    }).unwrap();

    dispatch(setResult(data));
    dispatch(
      recordPlacement({
        languageId,
        languageName: test.languageName,
        level: data.level,
        mode: data.mode,
        confidence: data.confidence,
        skills: data.skills,
        pendingReview: data.pendingReview,
      }),
    );
  };

  /* ------------------------------------------------------------------ result */
  if (stage === 'result' && result) {
    return (
      <PlacementResult
        result={result}
        returnTo={returnTo}
        onRestart={() => dispatch(restart())}
      />
    );
  }

  /* ---------------------------------------------------------------- language */
  if (stage === 'language') {
    return (
      <div>
        <StageHeader
          step="Step 1 of 6 · about 7 minutes"
          title="Which language are you placing?"
          description="Pick a language and we will work out your CEFR level in about seven minutes — speaking, writing and comprehension."
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
      </div>
    );
  }

  /* -------------------------------------------------------------- background */
  if (stage === 'background') {
    const question = test.background[cursor];
    const isLast = cursor === test.background.length - 1;

    return (
      <WizardFrame
        step="About you"
        title={`A little about your ${test.languageName}`}
        stage={stage}
        cursor={cursor}
        total={test.background.length}
        skipped={skipped}
        onBack={cursor === 0 ? () => dispatch(restart()) : () => dispatch(back())}
        onNext={() => (isLast ? dispatch(goToStage('quiz')) : dispatch(next()))}
        nextDisabled={!background[question.id]}
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

  /* ------------------------------------------------------------- vocabulary */
  if (stage === 'quiz' && test.mode === 'quiz') {
    const question = test.questions[cursor];
    const isLast = cursor === test.questions.length - 1;

    return (
      <WizardFrame
        step="Vocabulary"
        title={`${test.languageName} vocabulary and comprehension`}
        note="Guessing is fine — a wrong answer just tells us where to start."
        stage={stage}
        cursor={cursor}
        total={test.questions.length}
        skipped={skipped}
        onBack={cursor === 0 ? () => dispatch(goToStage('background')) : () => dispatch(back())}
        onNext={() => (isLast ? dispatch(goToStage('writing')) : dispatch(next()))}
        nextDisabled={!answers[question.id]}
        nextLabel={isLast ? 'On to writing' : 'Next'}
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

  /* ----------------------------------------------------------------- writing */
  if (stage === 'writing') {
    return (
      <WizardFrame
        step="Writing"
        title="Show us your writing"
        stage={stage}
        cursor={0}
        total={1}
        skipped={skipped}
        onBack={() => dispatch(goToStage(test.mode === 'quiz' ? 'quiz' : 'background'))}
        onNext={() => dispatch(goToStage('speaking'))}
        nextLabel="On to speaking"
      >
        <WritingTask
          prompt={test.writingPrompt}
          value={writingResponse}
          onChange={(value) => dispatch(setWriting(value))}
          onSkip={() => {
            dispatch(skipTask('writing'));
            dispatch(goToStage('speaking'));
          }}
        />
      </WizardFrame>
    );
  }

  /* ---------------------------------------------------------------- speaking */
  if (stage === 'speaking') {
    const prompt = test.speakingPrompts[cursor];
    const isLast = cursor === test.speakingPrompts.length - 1;

    return (
      <WizardFrame
        step="Speaking"
        title="Let us hear you"
        stage={stage}
        cursor={cursor}
        total={test.speakingPrompts.length}
        skipped={skipped}
        onBack={cursor === 0 ? () => dispatch(goToStage('writing')) : () => dispatch(back())}
        onNext={() => (isLast ? dispatch(goToStage('self')) : dispatch(next()))}
        nextLabel={isLast ? 'Last step' : 'Next prompt'}
      >
        <SpeakingTask
          prompt={prompt}
          transcribable={isTranscribable(languageId)}
          recording={recordings[prompt.id]}
          onRecorded={(recording) => dispatch(setRecording({ promptId: prompt.id, recording }))}
          onSkip={() => {
            dispatch(skipTask(prompt.id));
            if (isLast) dispatch(goToStage('self'));
            else dispatch(next());
          }}
        />
      </WizardFrame>
    );
  }

  /* -------------------------------------------------------------- self-check */
  return (
    <WizardFrame
      step="Final check"
      title="One last check"
      stage="self"
      cursor={0}
      total={1}
      skipped={skipped}
      onBack={() => dispatch(goToStage('speaking'))}
      onNext={finish}
      nextDisabled={isSubmitting}
      nextLabel={isSubmitting ? 'Working it out…' : 'See my level'}
    >
      <SelfAssessment
        checked={selfChecked}
        onToggle={(level) => dispatch(toggleSelfStatement(level))}
        description={`Tick every statement that is comfortably true today, ${user?.displayName?.split(' ')[0] ?? 'there'}. Be honest — it only helps us start you in the right place.`}
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
  skipped = [],
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  children,
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <StageHeader step={step} title={title} note={note} />
      <PlacementProgress
        stage={stage}
        cursor={cursor}
        totalInStage={total}
        skipped={skipped}
      />

      <div className="mt-8">{children}</div>

      <div className="mt-8 flex items-center justify-between gap-3">
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
