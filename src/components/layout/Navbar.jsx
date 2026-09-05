import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { useAppSelector } from '@/app/hooks';
import { selectIsSignedIn, selectUser } from '@/dashboard/auth/authSlice';
import Avatar from '@/components/ui/Avatar';
import LearnMenu, { LEARN_MODES } from '@/components/layout/LearnMenu';
import useActiveSection from '@/components/layout/useActiveSection';

/**
 * The three ways to learn live under one "Learn" menu; everything else is flat.
 *
 * `section` marks a link that points at part of a page rather than a page of its own. Those
 * cannot use NavLink, which compares pathnames only — `/#partners` has the pathname `/`, so
 * NavLink lit it up the moment the homepage loaded and left it lit forever. A section link
 * is active only while that section is actually on screen.
 *
 * `alsoActiveOn` covers the sub-page that belongs to the same idea: someone reading
 * /partners is plainly in the Partners part of the site even though the nav points at the
 * homepage band.
 */
export const NAV_LINKS = [
  { to: '/languages', label: 'Languages' },
  // Points at the homepage band rather than the sub-page: someone clicking "Partners"
  // in the nav wants a glance, and the band's own link takes them to the full list.
  { to: '/#partners', label: 'Partners', section: 'partners', on: '/', alsoActiveOn: ['/partners'] },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQ' },
];

/** Section ids the navbar needs to watch, so the observer is set up once. */
const SECTION_IDS = NAV_LINKS.filter((link) => link.section).map((link) => link.section);

export default function Navbar() {
  const isSignedIn = useAppSelector(selectIsSignedIn);
  const user = useAppSelector(selectUser);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  const activeSection = useActiveSection(SECTION_IDS);

  /** A section link is active when its section is on screen, or on its own sub-page. */
  const sectionIsActive = (link) =>
    (pathname === link.on && activeSection === link.section) ||
    (link.alsoActiveOn ?? []).includes(pathname);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClasses = ({ isActive }) =>
    cx(
      'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      isActive ? 'text-brand' : 'text-muted hover:text-fg',
    );

  return (
    <header
      className={cx(
        'sticky top-0 z-50 border-b bg-bg/80 backdrop-blur-md transition-colors',
        scrolled ? 'border-line' : 'border-transparent',
      )}
    >
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Logo />
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            <LearnMenu />
            {NAV_LINKS.map((link) => {
              // Section links compute their own state; NavLink cannot see a hash.
              if (link.section) {
                const active = sectionIsActive(link);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={active ? 'true' : undefined}
                    className={linkClasses({ isActive: active })}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" />
                    )}
                  </Link>
                );
              }

              return (
                <NavLink key={link.to} to={link.to} className={linkClasses}>
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button to="/placement-test" variant="subtle" size="sm" className="hidden sm:inline-flex">
            <Icon name="target" className="h-3.5 w-3.5" />
            Free placement test
          </Button>

          <ThemeToggle className="hidden sm:inline-flex" />

          {isSignedIn ? (
            <Button
              to="/dashboard"
              variant="outline"
              size="sm"
              className="hidden md:inline-flex"
            >
              <Avatar name={user.displayName} size="xs" ringed={false} />
              Dashboard
            </Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm" className="hidden md:inline-flex">
                Log in
              </Button>
              <Button to="/signup" size="sm" className="hidden md:inline-flex">
                Sign up
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg transition-colors hover:bg-subtle lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Icon name={open ? 'close' : 'menu'} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-line bg-bg lg:hidden">
          <nav className="container flex flex-col gap-0.5 py-3" aria-label="Mobile">
            <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
              Learn
            </p>
            {LEARN_MODES.map((mode) => (
              <NavLink
                key={mode.to}
                to={mode.to}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-brand-soft text-brand' : 'text-muted',
                  )
                }
              >
                {mode.label}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
              Explore
            </p>
            {NAV_LINKS.map((link) => {
              const mobileClasses = (isActive) =>
                cx(
                  'rounded-lg px-3 py-2.5 text-sm font-medium',
                  isActive ? 'bg-brand-soft text-brand' : 'text-muted',
                );

              if (link.section) {
                const active = sectionIsActive(link);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={active ? 'true' : undefined}
                    className={mobileClasses(active)}
                  >
                    {link.label}
                  </Link>
                );
              }

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => mobileClasses(isActive)}
                >
                  {link.label}
                </NavLink>
              );
            })}

            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-medium text-muted">Appearance</span>
              <ThemeToggle />
            </div>

            <div className="mt-3 grid gap-2">
              <Button to="/placement-test" variant="subtle" fullWidth>
                <Icon name="target" className="h-3.5 w-3.5" />
                Free placement test
              </Button>
              {isSignedIn ? (
                <Button to="/dashboard" variant="outline" fullWidth>
                  Go to dashboard
                </Button>
              ) : (
                <>
                  <Button to="/login" variant="outline" fullWidth>
                    Log in
                  </Button>
                  <Button to="/signup" fullWidth>
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
