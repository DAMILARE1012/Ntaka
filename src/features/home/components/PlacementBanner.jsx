import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import LevelLadder from '@/components/common/LevelLadder';
import { useAppSelector } from '@/app/hooks';
import { selectLearner } from '@/features/learner/learnerSlice';
import { getLanguage, LANGUAGES } from '@/services/mock/catalog';
import { getLevel } from '@/lib/cefr';

const STEPS = [
  { icon: 'globe', title: 'Pick a language', body: `All ${LANGUAGES.length} of them.` },
  { icon: 'compass', title: 'Answer a few questions', body: 'Six minutes, graded.' },
  { icon: 'target', title: 'Get your level', body: 'A1 to C2, plus what to do next.' },
];

/**
 * The "where do I start?" band. Shows a returning learner their saved placement
 * instead of the pitch.
 */
export default function PlacementBanner() {
  const learner = useAppSelector(selectLearner);
  const placedLanguageId = learner.focusLanguageId;
  const placement = placedLanguageId ? learner.levels[placedLanguageId] : null;
  const language = placedLanguageId ? getLanguage(placedLanguageId) : null;

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

            {placement ? (
              <>
                <h2 className="mt-4 text-balance text-2xl font-semibold">
                  Welcome back — you are {getLevel(placement.level).code} in {language?.name}.
                </h2>
                <p className="mt-3 text-muted">Pick up where you left off.</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button to={`/languages/${placedLanguageId}`} size="lg">
                    Continue {language?.name}
                  </Button>
                  <Button to="/placement-test" variant="outline" size="lg">
                    Place another language
                  </Button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="rounded-2xl bg-subtle p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              The six CEFR levels Ntaka teaches
            </p>
            <LevelLadder current={placement?.level} className="mt-4" compact />
            <p className="mt-4 text-xs text-muted">
              Every teacher, class and course is tagged to these levels.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
