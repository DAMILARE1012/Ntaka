import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Seo from '@/components/common/Seo';
import { title as seoTitle, description as seoDescription } from '@/lib/seo';
import { useAppDispatch } from '@/app/hooks';
import { useSignUpMutation } from '@/services/authApi';
import { ROLES } from '@/services/mock/accounts';
import { cx } from '@/lib/format';
import AuthLayout from '@/dashboard/auth/AuthLayout';
import AuthField from '@/dashboard/auth/AuthField';
import { sessionStarted } from '@/dashboard/auth/authSlice';

const ROLE_CHOICES = [
  {
    value: ROLES.LEARNER,
    icon: 'user',
    label: 'I want to learn',
    body: 'Book lessons, join classes, follow courses.',
  },
  {
    value: ROLES.TEACHER,
    icon: 'certificate',
    label: 'I want to teach',
    body: 'Set your hours and rate. Reviewed before you go live.',
  },
];

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [role, setRole] = useState(ROLES.LEARNER);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const [signUp, { isLoading }] = useSignUpMutation();

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    try {
      const session = await signUp({ email, password, displayName, role }).unwrap();
      dispatch(sessionStarted(session));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(error?.data ?? 'We could not create your account. Try again.');
    }
  };

  return (
    <>
      <Seo
        title={seoTitle('Create your account')}
        description={seoDescription('Create a free Ntaka account to book lessons with native African-language teachers.')}
        path="/signup"
        noindex
      />

      <AuthLayout
        title="Create your account"
        subtitle="Free to join. You only pay when you book a lesson."
        footer={
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">
              Sign in
            </Link>
          </p>
        }
      >
        <form onSubmit={submit} className="space-y-5" noValidate>
          <fieldset>
            <legend className="text-sm font-semibold text-fg">I am joining to…</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ROLE_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => setRole(choice.value)}
                  aria-pressed={role === choice.value}
                  className={cx(
                    'rounded-xl border p-3.5 text-left transition-colors',
                    role === choice.value
                      ? 'border-brand bg-brand-soft ring-1 ring-brand-border'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <Icon
                    name={choice.icon}
                    className={cx(
                      'h-4 w-4',
                      role === choice.value ? 'text-brand' : 'text-faint',
                    )}
                  />
                  <span className="mt-2 block text-sm font-semibold text-fg">
                    {choice.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{choice.body}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <AuthField
            label="Your name"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="name"
            placeholder="How should teachers greet you?"
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="At least 8 characters."
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
            {isLoading ? 'Creating your account…' : 'Create account'}
          </Button>

          <p className="text-xs text-muted">
            By continuing you agree to Ntaka&rsquo;s terms and privacy policy.
          </p>
        </form>
      </AuthLayout>
    </>
  );
}
