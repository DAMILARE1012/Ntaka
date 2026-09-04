import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

/**
 * The live call.
 *
 * `@daily-co/daily-js` is imported dynamically inside an effect for two reasons: it is
 * a large bundle that only this screen needs, and it touches `window` at module scope,
 * which would break server rendering and the prerender build.
 *
 * With `provider: 'mock'` there is no room to connect to, so a stand-in frame is shown
 * instead of a broken iframe. Add DAILY_API_KEY on the server and the same component
 * mounts a real call with no code change here.
 */
export default function CallFrame({ session, onLeft }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.provider !== 'daily') return undefined;

    let cancelled = false;
    let frame;

    (async () => {
      try {
        const { default: DailyIframe } = await import('@daily-co/daily-js');
        if (cancelled || !containerRef.current) return;

        // A stale frame from a previous mount would throw on duplicate instances.
        frame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            position: 'relative',
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px',
          },
        });
        frameRef.current = frame;

        frame
          .on('joined-meeting', () => setStatus('joined'))
          .on('left-meeting', () => {
            setStatus('left');
            onLeft?.();
          })
          .on('error', (event) => {
            setError(event?.errorMsg ?? 'The call dropped.');
            setStatus('error');
          });

        // The token carries the room, the identity and the role. Nothing here is
        // trusted input - it was minted server-side for this user and this lesson.
        await frame.join({ url: session.roomUrl, token: session.token });
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Could not start the call.');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      frame?.destroy?.();
      frameRef.current = null;
    };
  }, [session, onLeft]);

  if (session?.provider !== 'daily') {
    return <MockFrame session={session} onLeft={onLeft} />;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink-950">
      <div ref={containerRef} className="h-full w-full" />

      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-200">
          <Icon name="video" className="h-6 w-6 animate-pulse" />
          <p className="text-sm">Connecting…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Icon name="shield" className="h-6 w-6 text-danger" />
          <p className="text-sm text-white">{error}</p>
          <Button variant="light" size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Shown until DAILY_API_KEY exists on the server. It renders what the room *would*
 * be rather than a spinner that never resolves, so the surrounding flow stays testable.
 */
function MockFrame({ session, onLeft }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-leaf-800 via-ink-900 to-ink-950">
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 12px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 18px)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
          <Icon name="video" className="h-6 w-6" />
        </span>
        <p className="font-display text-lg font-semibold text-white">
          Room ready for {session?.counterpart}
        </p>
        <p className="max-w-sm text-sm text-ink-200">
          Authorisation passed and a token was issued for you as{' '}
          <span className="font-semibold text-leaf-300">{session?.role}</span>. Video is not
          connected because the server has no Daily API key yet.
        </p>
        <code className="rounded bg-black/30 px-2 py-1 text-2xs text-ink-300">
          {session?.roomName}
        </code>

        <Button variant="light" size="sm" className="mt-2" onClick={onLeft}>
          Leave room
        </Button>
      </div>
    </div>
  );
}
