import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectThemeMode } from '@/features/theme/themeSlice';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PersonalizationButton from '@/features/personalization/PersonalizationButton';

/** Scrolls to top on navigation — routers do not do this for you. */
/**
 * Routers do not restore scroll, and they do not honour a hash on navigation either.
 *
 * A link to /#partners has to work from two places: from another page, where React has
 * to mount the homepage before the target exists, and from the homepage itself, where
 * only the hash changes and no re-render is guaranteed. Hence the rAF - it waits for the
 * paint that puts the section in the document before looking for it.
 */
function ScrollManager() {
  // `key` changes on every navigation, including a push to the URL you are already on.
  // Without it, scrolling away and clicking the same nav link again would do nothing,
  // because neither pathname nor hash changed.
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return undefined;
    }

    // A hash from a URL is untrusted input; an invalid one would throw out of querySelector.
    const find = () => {
      try {
        return document.querySelector(hash);
      } catch {
        return null;
      }
    };

    let frame = requestAnimationFrame(() => {
      const target = find();
      if (target) {
        // scroll-mt-* on the target keeps it clear of the sticky header.
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Second chance for anything that mounts a frame late.
        frame = requestAnimationFrame(() => {
          find()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, key]);

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
      <ScrollManager />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <PersonalizationButton />
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
