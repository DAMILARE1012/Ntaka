import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectThemeMode } from '@/features/theme/themeSlice';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/** Scrolls to top on navigation — routers do not do this for you. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'auto' : 'auto' });
  }, [pathname]);
  return null;
}

export default function PageLayout({ children }) {
  const mode = useAppSelector(selectThemeMode);

  // Keep <html class="dark"> in step with the store, including on first mount.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** Standard page header for the listing pages. */
export function PageHeader({ eyebrow, title, description, children, className = '' }) {
  return (
    <section className={`border-b border-line bg-surface ${className}`}>
      <div className="container py-9 md:py-12">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-balance text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-2.5 max-w-2xl text-sm text-muted">{description}</p>}
        {children}
      </div>
    </section>
  );
}
