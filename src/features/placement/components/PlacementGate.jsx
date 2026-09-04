import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { useAppDispatch } from '@/app/hooks';
import { redirectRequested } from '@/dashboard/auth/authSlice';
import { usePlacementGate } from '@/features/placement/usePlacementGate';

/**
 * The block a learner sees when they try to start learning without a placement.
 *
 * There is no way past it except taking the test. An earlier version offered "I know my
 * level" as an escape; that was removed on purpose. A self-declared level is a guess, and
 * a guess puts a learner in the wrong lesson, wastes a teacher's preparation and produces
 * the refund that costs more than the friction ever did.
 *
 * The test is free, takes about seven minutes, and only has to be done once per language.
 */
const REASONS = [
  'Your teacher knows what to prepare before you meet',
  'You are shown classes and courses at your level, not everyone else’s',
  'You can see yourself improve, because we keep every attempt',
];

export default function PlacementGate({ language, action = 'start learning', compact = false }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const gate = usePlacementGate(language?.id);

  const start = () => {
    if (gate.needsSignIn) {
      // Sign in first, then straight into the test - not back to a wall.
      dispatch(redirectRequested(gate.testPath));
      navigate('/login');
      return;
    }
    navigate(gate.testPath);
  };

  return (
    <div
      className={cx(
        'rounded-xl border border-brand-border bg-brand-soft',
        compact ? 'p-4' : 'p-5',
      )}
    >
      <div className="flex gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-brand">
          <Icon name="target" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">
            Take the free {language?.name} placement test first
          </p>
          <p className="mt-1 text-sm text-muted">
            Everyone on Ntaka is placed before they {action}. It is free, takes about seven
            minutes, and you only do it once per language.
          </p>
        </div>
      </div>

      {!compact && (
        <ul className="mt-4 space-y-1.5">
          {REASONS.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-sm text-muted">
              <Icon
                name="check"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"
                strokeWidth={2.5}
              />
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* A real link once signed in: the destination belongs in the DOM so it can be
            opened in a new tab, previewed on hover and read by assistive tech. Signed
            out it has to be a button, because sign-in has to be recorded first. */}
        {gate.needsSignIn ? (
          <Button size="sm" onClick={start}>
            Sign in and take the test
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button size="sm" to={gate.testPath}>
            Take the free test
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Button>
        )}
        <Link
          to="/placement-test"
          className="text-2xs font-semibold text-muted underline underline-offset-2 hover:text-fg"
        >
          What is in the test?
        </Link>
      </div>
    </div>
  );
}

/**
 * Full-page version, for screens that are entirely learning - the course player. There is
 * nothing useful to show behind the gate there, so it replaces the page rather than
 * sitting on top of it.
 */
export function PlacementRequiredScreen({ language, action = 'open this course', backTo, backLabel }) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon name="target" className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-xl font-semibold sm:text-2xl">
        Find your {language?.name} level first
      </h1>
      <p className="mt-2 text-muted">
        Ntaka places every learner before they {action}, so the material starts where you
        actually are. It is free and takes about seven minutes.
      </p>

      <div className="mt-6 text-left">
        <PlacementGate language={language} action={action} />
      </div>

      {backTo && (
        <Link
          to={backTo}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          {backLabel ?? 'Go back'}
        </Link>
      )}
    </div>
  );
}
