import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getLevel } from '@/lib/cefr';

/**
 * The moment straight after the placement test.
 *
 * The order of this block is the whole design. It leads with what the learner CAN DO, then
 * the milestone they just earned, then the level code — because a level code arriving
 * first reads as a mark out of ten. "A1" tells someone who grew up hearing Yorùbá at home
 * that they know nothing, when what is actually true is that they understand more than
 * they can write. That learner is a large share of this platform's audience, and losing
 * them in the six seconds after a test result is the most expensive thing that can happen
 * here.
 *
 * So: no confetti, no score-first reveal, no "you scored 4/12". Recognition of the effort,
 * evidence of what they already have, and one obvious next thing to do.
 */

/** Effort worth naming back to them, in the order it takes courage to do it. */
function effortLine(result) {
  const spoke = result.skills?.speaking?.attempted;
  const wrote = result.skills?.writing?.attempted;

  if (spoke && wrote) return 'You spoke, you wrote, and you finished the whole thing.';
  if (spoke) return 'You recorded yourself speaking — most people skip that part.';
  if (wrote) return 'You wrote your own sentences rather than only picking answers.';
  return 'You finished the whole test.';
}

export default function PlacementCelebration({ result, milestone, languageName }) {
  const level = getLevel(result.level);

  return (
    <section className="overflow-hidden rounded-3xl border border-brand-border bg-brand-soft">
      <div className="brand-rule" />

      <div className="p-7 sm:p-9">
        <Badge tone="palm">
          <Icon name="sparkles" className="h-3.5 w-3.5" />
          {effortLine(result)}
        </Badge>

        {/* What they can already do, before any label is put on them. */}
        <h2 className="mt-4 text-balance font-display text-2xl font-semibold text-fg sm:text-3xl">
          Here is what you can already do in {languageName}
        </h2>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {level.canDo.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-md text-fg">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                <Icon name="check" className="h-3 w-3" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
          That is <span className="font-semibold text-fg">{level.code} — {level.name}</span> on
          the CEFR scale. It is a starting line, not a score. If you grew up hearing{' '}
          {languageName} but never read or wrote it, expect this to sit lower than it feels —
          your teacher can move it after one lesson.
        </p>

        {milestone && (
          <div className="mt-6 flex items-start gap-4 rounded-2xl border border-brand-border bg-surface p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg">
              <Icon name={milestone.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-brand">
                Milestone earned
              </p>
              <p className="mt-0.5 font-display text-md font-semibold text-fg">{milestone.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{milestone.body}</p>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap gap-3">
          <Button to="/dashboard/courses" size="lg">
            Start your first lesson
            <Icon name="arrowRight" className="h-4 w-4" />
          </Button>
          <Button to="/dashboard/milestones" variant="outline" size="lg">
            See all milestones
          </Button>
        </div>
      </div>
    </section>
  );
}
