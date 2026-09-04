import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import LevelLadder from '@/components/common/LevelLadder';
import { LANGUAGES } from '@/services/mock/catalog';

const STEPS = [
  { icon: 'globe', title: 'Pick a language', body: `All ${LANGUAGES.length} of them.` },
  { icon: 'compass', title: 'Answer a few questions', body: 'Six minutes, graded.' },
  { icon: 'target', title: 'Get your level', body: 'A1 to C2, plus what to do next.' },
];

/**
 * The "where do I start?" band.
 *
 * Deliberately identical for everyone, signed in or not. It used to greet a returning
 * learner with their level and mark it on the ladder, which was wrong twice over: a
 * placement result is profile data and belongs behind the sign-in, not on a public page
 * someone may well be reading over a shoulder; and this page is prerendered to static
 * HTML, so personalising it client-side means the served markup and the hydrated markup
 * disagree. The learner's own result lives on their dashboard.
 */
export default function PlacementBanner() {
  return (
    <section className="container py-14">
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="brand-rule" />

        <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Badge tone="palm">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Always free
            </Badge>

            <h2 className="mt-4 text-balance text-2xl font-semibold">
              Not sure where to start?
            </h2>
            <p className="mt-3 text-muted">
              Too low and you get bored. Too high and you quit. Six free minutes, and you will
              know.
            </p>

            <ol className="mt-7 space-y-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-fg">
                      {i + 1}. {step.title}
                    </span>
                    <span className="block text-sm text-muted">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/placement-test" size="lg">
                Start the free placement test
                <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
              <Button to="/languages" variant="ghost" size="lg">
                Browse languages first
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-subtle p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              The six CEFR levels Ntaka teaches
            </p>
            <LevelLadder className="mt-4" compact />
            <p className="mt-4 text-xs text-muted">
              Every teacher, class and course is tagged to these levels.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
