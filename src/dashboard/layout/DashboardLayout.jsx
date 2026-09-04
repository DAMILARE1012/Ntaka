import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Seo from '@/components/common/Seo';
import { title as seoTitle, description as seoDescription } from '@/lib/seo';
import { cx } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useSignOutMutation } from '@/services/authApi';
import { ROLE_LABELS } from '@/services/mock/accounts';
import Sidebar from '@/dashboard/layout/Sidebar';
import { sessionEnded, selectUser } from '@/dashboard/auth/authSlice';

/**
 * Shell for the authenticated app.
 *
 * Deliberately different chrome from the public site: a persistent sidebar instead of a
 * marketing nav, and no footer. A learner should be able to tell at a glance whether
 * they are browsing or working.
 */
export default function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAppSelector(selectUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signOut, { isLoading: signingOut }] = useSignOutMutation();

  useEffect(() => setDrawerOpen(false), [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut().unwrap();
    } finally {
      dispatch(sessionEnded());
      navigate('/', { replace: true });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* The whole dashboard is private: never index any of it. */}
      <Seo
        title={seoTitle('Dashboard')}
        description={seoDescription('Your Ntaka dashboard.')}
        path="/dashboard"
        noindex
      />

      <div className="flex">
        {/* ------------------------------------------------------- sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-surface lg:block">
          <Sidebar role={user.role} />
        </aside>

        {/* mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            />
            <div className="animate-fade-in absolute inset-y-0 left-0 w-64 border-r border-line bg-surface">
              <Sidebar role={user.role} onNavigate={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg transition-colors hover:bg-subtle lg:hidden"
              >
                <Icon name="menu" className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-fg">
                  {greeting()}, {user.displayName.split(' ')[0]}
                </p>
                <p className="truncate text-2xs text-faint">
                  {ROLE_LABELS[user.role]} · {user.timezone}
                </p>
              </div>

              <ThemeToggle className="hidden sm:inline-flex" />

              <div className="flex items-center gap-2">
                <Avatar name={user.displayName} size="sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="hidden sm:inline-flex"
                >
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </Button>
              </div>
            </div>
          </header>

          <main className={cx('mx-auto max-w-5xl px-4 py-8 sm:px-6')}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
