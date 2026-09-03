import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

export const NAV_LINKS = [
  { to: '/teachers', label: '1-on-1 Lessons' },
  { to: '/classes', label: 'Group Classes' },
  { to: '/video-learning', label: 'Video Learning' },
  { to: '/languages', label: 'Languages' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

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
            {NAV_LINKS.map((link) => (
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
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button to="/placement-test" variant="subtle" size="sm" className="hidden sm:inline-flex">
            <Icon name="target" className="h-3.5 w-3.5" />
            Free placement test
          </Button>

          <ThemeToggle className="hidden sm:inline-flex" />

          <Button variant="ghost" size="sm" className="hidden md:inline-flex">
            Log in
          </Button>
          <Button size="sm" className="hidden md:inline-flex">
            Sign up
          </Button>

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
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-brand-soft text-brand' : 'text-muted',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-medium text-muted">Appearance</span>
              <ThemeToggle />
            </div>

            <div className="mt-3 grid gap-2">
              <Button to="/placement-test" variant="subtle" fullWidth>
                <Icon name="target" className="h-3.5 w-3.5" />
                Free placement test
              </Button>
              <Button variant="outline" fullWidth>
                Log in or sign up
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
