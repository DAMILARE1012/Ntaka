import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { useAppSelector } from '@/app/hooks';
import { selectLearner } from '@/features/learner/learnerSlice';
import { selectAllProgress } from '@/features/learning/progressSlice';
import { VIDEOS_BY_ID } from '@/services/mock/videos';
import { buildCurriculum, flattenCurriculum } from '@/services/mock/courseContent';
import { profileFrom, evaluateMilestones, TIERS } from '@/features/motivation/milestones';

/**
 * The learner's milestones.
 *
 * Locked ones are shown rather than hidden, and they are shown with their real text rather
 * than as question marks. A visible, readable next milestone is a goal; a row of padlocks
 * is a nag. "Practised on seven days" tells someone what to do next — "???" tells them
 * only that they are behind.
 *
 * Dashboard-only: it reads placement history and course progress.
 */

const TIER_LABELS = {
  [TIERS.START]: 'Getting started',
  [TIERS.PRACTICE]: 'Keeping going',
  [TIERS.DEPTH]: 'Going deeper',
};

export function useMilestoneProfile() {
  const learner = useAppSelector(selectLearner);
  const progress = useAppSelector(selectAllProgress);

  return profileFrom({
    history: learner.history,
    levels: learner.levels,
    progress,
    curriculumFor: (courseId) => {
      const course = VIDEOS_BY_ID[courseId];
      return course ? flattenCurriculum(buildCurriculum(course)) : [];
    },
  });
}

function MilestoneRow({ milestone, earned }) {
  return (
    <li
      className={cx(
        'flex items-start gap-4 rounded-2xl border p-4 transition-colors',
        earned ? 'border-brand-border bg-brand-soft/50' : 'border-line bg-surface',
      )}
    >
      <span
        className={cx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          earned ? 'bg-brand text-brand-fg' : 'bg-subtle text-faint',
        )}
      >
        <Icon name={milestone.icon} className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className={cx('font-semibold', earned ? 'text-fg' : 'text-muted')}>
            {milestone.title}
          </span>
          {earned && (
            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-brand">
              <Icon name="check" className="h-3 w-3" strokeWidth={3} />
              Earned
            </span>
          )}
        </p>
        <p className={cx('mt-1 text-sm leading-relaxed', earned ? 'text-muted' : 'text-faint')}>
          {milestone.body}
        </p>
      </div>
    </li>
  );
}

export default function MilestoneBoard({ className, compact = false, limit = null }) {
  const profile = useMilestoneProfile();
  const { earned, locked, total } = evaluateMilestones(profile);

  const earnedIds = new Set(earned.map((m) => m.id));

  // Earned first, then the nearest goals. Someone opening this wants to see what they have
  // before what they have not.
  const ordered = [...earned, ...locked];
  const shown = limit ? ordered.slice(0, limit) : ordered;

  const byTier = Object.values(TIERS)
    .map((tier) => ({ tier, items: shown.filter((m) => m.tier === tier) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="nums text-sm text-muted">
          <span className="font-semibold text-fg">{earned.length}</span> of {total} earned
        </p>
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-subtle">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500"
            style={{ width: `${Math.round((earned.length / total) * 100)}%` }}
          />
        </div>
      </div>

      {compact ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {shown.map((milestone) => (
            <MilestoneRow
              key={milestone.id}
              milestone={milestone}
              earned={earnedIds.has(milestone.id)}
            />
          ))}
        </ul>
      ) : (
        byTier.map((group) => (
          <section key={group.tier} className="mt-7 first:mt-6">
            <h3 className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
              {TIER_LABELS[group.tier]}
            </h3>
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
              {group.items.map((milestone) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  earned={earnedIds.has(milestone.id)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <p className="mt-6 text-xs leading-relaxed text-faint">
        Milestones are earned once and kept. Nothing here expires, and missing a week costs
        you nothing — there is no streak to break.
      </p>
    </div>
  );
}
