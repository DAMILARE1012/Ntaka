import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import LevelLadder from '@/components/common/LevelLadder';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';
import { graph, assessmentPage, breadcrumbs } from '@/lib/structuredData';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsSignedIn, redirectRequested } from '@/dashboard/auth/authSlice';
import { LANGUAGES } from '@/services/mock/catalog';

/**
 * Public landing page for the placement test.
 *
 * The test itself runs inside the dashboard: it records audio, stores a result against
 * the learner's account and drives teacher matching, none of which works for an
 * anonymous visitor. This page exists to explain it and convert - and because
 * "what level is my Yoruba" is the highest-intent, lowest-competition search term this
 * platform has, so the URL has to stay public and indexable.
 */

const PARTS = [
  {
    icon: 'mic',
    title: 'Speaking',
    body: 'Read a line aloud, then answer a question in your own words. We record it so your first teacher hears where you really are.',
  },
  {
    icon: 'book',
    title: 'Writing',
    body: 'Write a few sentences. We check length, tone marks and the words we would expect at each level.',
  },
  {
    icon: 'target',
    title: 'Vocabulary & comprehension',
    body: 'Graded questions from greetings up to proverbs, so we can see where your understanding stops.',
  },
];

export default function PlacementTestPage() {
  const dispatch = useAppDispatch();
  const isSignedIn = useAppSelector(selectIsSignedIn);

  // Remember the destination so sign-in lands them straight in the test.
  const rememberDestination = () => {
    if (!isSignedIn) dispatch(redirectRequested('/dashboard/placement'));
  };

  const cta = isSignedIn ? '/dashboard/placement' : '/signup';

  return (
    <>
      <Seo
        {...STATIC_SEO.placement}
        jsonLd={graph(
          assessmentPage(STATIC_SEO.placement),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Free placement test', path: '/placement-test' },
          ]),
        )}
      />

      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-line bg-surface">
        <div className="container grid gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Badge tone="palm">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Always free
            </Badge>

            <h1 className="mt-4 text-balance font-display text-3xl font-semibold sm:text-4xl">
              Find your level before you pay for a single lesson.
            </h1>
            <p className="mt-3 max-w-xl text-muted">
              Six minutes. You speak, you write, you answer a few questions. We place you on the
              CEFR scale and match you with teachers who take learners at exactly that level.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button to={cta} size="lg" onClick={rememberDestination}>
                {isSignedIn ? 'Start the test' : 'Create a free account to start'}
                <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
              {!isSignedIn && (
                <Button to="/login" variant="outline" size="lg" onClick={rememberDestination}>
                  I already have an account
                </Button>
              )}
            </div>

            <p className="mt-4 text-xs text-muted">
              {isSignedIn
                ? 'Your result is saved to your account and shapes every recommendation you see.'
                : 'An account takes fifteen seconds and no card. Your result is saved, so the teachers, classes and courses we show you are the ones for your level.'}
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-subtle p-6">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
              What the test covers
            </p>
            <ul className="mt-4 space-y-4">
              {PARTS.map((part) => (
                <li key={part.title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon name={part.icon} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-fg">{part.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{part.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- levels */}
      <section className="container py-14">
        <h2 className="text-xl font-semibold sm:text-2xl">The six levels we place you on</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Ntaka uses the CEFR scale, the same standard used for European languages. Every teacher,
          class and course is tagged to it, so &ldquo;intermediate&rdquo; means one thing across
          the whole platform.
        </p>
        <LevelLadder className="mt-6" />
      </section>

      {/* ------------------------------------------------------------ coverage */}
      <section className="border-t border-line bg-surface py-14">
        <div className="container">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Available in every language we teach
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Graded question banks exist for eight languages so far. The rest use the speaking,
            writing and CEFR self-check, and your first teacher confirms the result in your trial
            lesson.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <Link
                key={language.id}
                to={`/languages/${language.id}`}
                className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-brand-border hover:text-brand"
              >
                {language.name}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Button to={cta} size="lg" onClick={rememberDestination}>
              {isSignedIn ? 'Start the test' : 'Create a free account to start'}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
