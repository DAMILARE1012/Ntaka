import { Link } from 'react-router-dom';
import Logo from '@/components/layout/Logo';
import Icon from '@/components/ui/Icon';
import ThemeToggle from '@/components/layout/ThemeToggle';

const PROOF = [
  'Free placement test, no card needed',
  'Native teachers across 14 countries',
  'Live lessons, group classes and interactive courses',
];

/**
 * Split-screen frame for sign in and sign up. The marketing chrome is deliberately
 * absent - there is nothing to browse here, and the nav would only offer ways to leave.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* -------------------------------------------------------------- form */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <div className="mx-auto w-full max-w-sm text-sm text-muted">{footer}</div>
      </div>

      {/* ------------------------------------------------------------- aside */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 12px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 18px)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-leaf-500/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col justify-center px-12 py-16">
          <p className="font-display text-3xl font-semibold leading-tight text-white">
            Speak the languages of Africa.
          </p>
          <p className="mt-3 max-w-sm text-ink-200">
            Taught by the people who grew up speaking them.
          </p>

          <ul className="mt-10 space-y-3">
            {PROOF.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink-100">
                <Icon
                  name="check"
                  className="mt-0.5 h-4 w-4 shrink-0 text-leaf-300"
                  strokeWidth={2.5}
                />
                {item}
              </li>
            ))}
          </ul>

          <Link
            to="/"
            className="mt-12 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-300 transition-colors hover:text-white"
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  );
}
