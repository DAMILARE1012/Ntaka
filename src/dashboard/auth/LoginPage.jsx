import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Seo from '@/components/common/Seo';
import { title as seoTitle, description as seoDescription } from '@/lib/seo';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useSignInMutation } from '@/services/authApi';
import { DEMO_LOGINS, ROLE_LABELS } from '@/services/mock/accounts';
import AuthLayout from '@/dashboard/auth/AuthLayout';
import AuthField from '@/dashboard/auth/AuthField';
import {
  sessionStarted,
  redirectConsumed,
  selectRedirectTo,
} from '@/dashboard/auth/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const redirectTo = useAppSelector(selectRedirectTo);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const [signIn, { isLoading }] = useSignInMutation();

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    try {
      const session = await signIn({ email, password }).unwrap();
      dispatch(sessionStarted(session));
      const destination = redirectTo ?? '/dashboard';
      dispatch(redirectConsumed());
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(error?.data ?? 'We could not sign you in. Try again.');
    }
  };

  return (
    <>
      <Seo
        title={seoTitle('Sign in')}
        description={seoDescription('Sign in to Ntaka to book lessons, join classes and track your progress.')}
        path="/login"
        noindex
      />

      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to book lessons, join your classes and pick up where you left off."
        footer={
          <p>
            New to Ntaka?{' '}
            <Link to="/signup" className="font-semibold text-brand hover:text-brand-hover">
              Create an account
            </Link>
          </p>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Your password"
          />

          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger"
            >
              <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing you in…' : 'Sign in'}
          </Button>
        </form>

        <DemoAccounts
          onPick={(demoEmail) => {
            setEmail(demoEmail);
            setPassword('ntaka-demo');
            setFormError('');
          }}
        />
      </AuthLayout>
    </>
  );
}

/**
 * Visible only while auth is backed by the fixture. Delete this component together with
 * services/mock/accounts.js when real authentication lands.
 */
function DemoAccounts({ onPick }) {
  return (
    <div className="mt-8 rounded-xl border border-line bg-subtle p-4">
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
        Demo accounts
      </p>
      <p className="mt-1.5 text-xs text-muted">
        Auth is running against fixtures. Pick a role to fill the form — any password works.
      </p>
      <div className="mt-3 grid gap-1.5">
        {DEMO_LOGINS.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => onPick(account.email)}
            className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-brand-border hover:bg-brand-soft"
          >
            <span className="font-medium text-fg">{account.email}</span>
            <span className="text-2xs font-semibold uppercase tracking-wide text-brand">
              {ROLE_LABELS[account.role]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
