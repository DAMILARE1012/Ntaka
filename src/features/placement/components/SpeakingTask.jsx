import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { cx } from '@/lib/format';

/**
 * Record a spoken answer.
 *
 * Uses MediaRecorder, which needs an explicit microphone grant and a secure context
 * (https or localhost). Both can fail for reasons that are nothing to do with the
 * learner — a locked-down work laptop, a browser that blocks by default, no mic at all —
 * so every failure path offers "skip this" rather than trapping them in the test.
 *
 * The recording is never scored by code. It is captured for a teacher to listen to; see
 * lib/placementScoring.js for why claiming to grade pronunciation here would be a lie.
 */
export default function SpeakingTask({ prompt, recording, onRecorded, onSkip, transcribable }) {
  const [state, setState] = useState('idle'); // idle | requesting | recording | done | denied | unsupported
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const supported =
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator?.mediaDevices?.getUserMedia);

  // Releasing the mic matters: the browser keeps showing a recording indicator otherwise.
  const cleanup = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => cleanup, []);

  useEffect(() => {
    setState(recording ? 'done' : 'idle');
    setSeconds(0);
  }, [prompt?.id, recording]);

  const start = async () => {
    setError('');
    if (!supported) {
      setState('unsupported');
      return;
    }

    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanup();
        setState('done');
        onRecorded({
          promptId: prompt.id,
          durationMs,
          size: blob.size,
          // Object URL so the learner can play it back. In production this is uploaded
          // to storage and the result keeps the object path instead.
          url: URL.createObjectURL(blob),
          mimeType: blob.type,
        });
      };

      startedAtRef.current = Date.now();
      recorder.start();
      setState('recording');
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((value) => {
          const next = value + 1;
          if (next >= prompt.maxSeconds) stop();
          return next;
        });
      }, 1000);
    } catch (err) {
      cleanup();
      // NotAllowedError means denied; NotFoundError means there is no microphone.
      setState(err?.name === 'NotFoundError' ? 'unsupported' : 'denied');
      setError(err?.message ?? '');
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const reset = () => {
    onRecorded(null);
    setState('idle');
    setSeconds(0);
  };

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2">
        <Badge tone="clay">
          <Icon name="mic" className="h-3 w-3" />
          Speaking
        </Badge>
        {prompt.kind === 'read-aloud' && <Badge tone="neutral">Read aloud</Badge>}
      </div>

      <h2 className="mt-3 text-balance text-xl font-semibold sm:text-2xl">{prompt.title}</h2>
      <p className="mt-2 text-muted">{prompt.instruction}</p>

      {prompt.text && (
        <p className="mt-5 rounded-xl border border-brand-border bg-brand-soft px-5 py-4 text-center font-display text-2xl font-semibold text-fg">
          {prompt.text}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        {state === 'unsupported' && (
          <Fallback
            title="No microphone available"
            body="Your browser or device will not let us record here. You can skip this part — your first teacher will hear you speak in the trial lesson."
            onSkip={onSkip}
          />
        )}

        {state === 'denied' && (
          <Fallback
            title="Microphone blocked"
            body="We could not access your microphone. Allow it in your browser's address bar and try again, or skip this part."
            detail={error}
            onRetry={start}
            onSkip={onSkip}
          />
        )}

        {(state === 'idle' || state === 'requesting') && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <button
              type="button"
              onClick={start}
              disabled={state === 'requesting'}
              aria-label="Start recording"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-brand-fg transition-transform hover:scale-105 disabled:opacity-60"
            >
              <Icon name="mic" className="h-7 w-7" />
            </button>
            <p className="text-sm font-semibold text-fg">
              {state === 'requesting' ? 'Waiting for microphone…' : 'Tap to record'}
            </p>
            <p className="text-2xs text-muted">Up to {prompt.maxSeconds} seconds.</p>
            <button
              type="button"
              onClick={onSkip}
              className="text-2xs font-semibold text-muted underline underline-offset-2 hover:text-fg"
            >
              Skip this one
            </button>
          </div>
        )}

        {state === 'recording' && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <button
              type="button"
              onClick={stop}
              aria-label="Stop recording"
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white"
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />
              <span className="relative h-5 w-5 rounded-sm bg-white" />
            </button>
            <p className="nums text-sm font-semibold text-fg">
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:
              {String(seconds % 60).padStart(2, '0')}
            </p>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-danger transition-[width] duration-1000 ease-linear"
                style={{ width: `${(seconds / prompt.maxSeconds) * 100}%` }}
              />
            </div>
            <p className="text-2xs text-muted">Tap the square to stop.</p>
          </div>
        )}

        {state === 'done' && recording && (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon name="check" className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <p className="text-sm font-semibold text-fg">
              Recorded {Math.round(recording.durationMs / 1000)} seconds
            </p>
            {recording.url && (
              <audio controls src={recording.url} className="w-full max-w-xs">
                <track kind="captions" />
              </audio>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              Record again
            </Button>
          </div>
        )}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-2xs text-muted">
        <Icon name="shield" className="mt-0.5 h-3 w-3 shrink-0" />
        {transcribable
          ? 'Your recording is transcribed to check how much of the answer was in the target language, then shared with the teacher you book. Pronunciation is judged by a person, never automatically.'
          : 'Your recording goes straight to the teacher you book — automatic transcription does not cover this language, and we would rather give you nothing than give you a guess.'}
      </p>
    </div>
  );
}

function Fallback({ title, body, detail, onRetry, onSkip }) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-2 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-faint">
        <Icon name="mic" className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {detail && <p className="text-2xs text-faint">{detail}</p>}
      <div className={cx('mt-2 flex gap-2')}>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Button size="sm" onClick={onSkip}>
          Skip this part
        </Button>
      </div>
    </div>
  );
}
