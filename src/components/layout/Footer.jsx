import { Link } from 'react-router-dom';
import Logo from '@/components/layout/Logo';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import Flag from '@/components/common/Flag';

const COLUMNS = [
  {
    title: 'Learn',
    links: [
      { label: '1-on-1 lessons', to: '/teachers' },
      { label: 'Group classes', to: '/classes' },
      { label: 'Video learning', to: '/video-learning' },
      { label: 'Free placement test', to: '/placement-test' },
      { label: 'All languages', to: '/languages' },
    ],
  },
  {
    title: 'Teach',
    links: [
      { label: 'Become a teacher', to: '/teachers' },
      { label: 'Teacher handbook', to: '/teachers' },
      { label: 'Record a course', to: '/video-learning' },
      { label: 'Community guidelines', to: '/languages' },
    ],
  },
  {
    title: 'Ntaka',
    links: [
      { label: 'Our mission', to: '/' },
      { label: 'How levels work', to: '/placement-test' },
      { label: 'Help centre', to: '/' },
      { label: 'Contact', to: '/' },
    ],
  },
];

export default function Footer() {
  const popular = LANGUAGES_FULL.filter((l) => l.featured).slice(0, 8);

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="brand-rule" />
      <div className="container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-muted">
              African languages online. Taught live by native speakers, graded to the CEFR levels.
            </p>
            <p className="mt-5 text-sm font-semibold text-fg">
              Ẹ ku àárọ̀ · Kedu · Sannu · Habari · Sawubona · Selam
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted transition-colors hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
            Popular languages
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {popular.map((language) => (
              <Link
                key={language.id}
                to={`/languages/${language.id}`}
                className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-brand"
              >
                <Flag iso={language.iso} size="xs" />
                Learn {language.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Ntaka. Built for African languages.</p>
          <p className="flex gap-5">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
