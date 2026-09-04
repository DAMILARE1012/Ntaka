import Icon from '@/components/ui/Icon';

/**
 * The data-protection strip in the footer.
 *
 * Every claim here is one the codebase can actually back, which is the point — a generic
 * "we are data compliant" badge is worth nothing to a learner and is a liability if it
 * outruns the implementation. So:
 *
 *   * NDPA / GDPR name the two regimes that actually reach our learners: Nigeria is the
 *     primary market, and the diaspora audience puts us squarely inside the EU/UK GDPR.
 *   * "Consent first" is literal. server/assess-placement.js refuses to call the
 *     transcription provider at all without `consented` - a gate, not a checkbox.
 *   * "Scored, then discarded" is true because nothing in the speaking flow persists the
 *     audio: it is posted, turned into signals, and dropped.
 *
 * If any of those three stops being true, this component has to change with it.
 */
const POINTS = [
  { icon: 'shield', label: 'NDPA & GDPR aligned' },
  { icon: 'mic', label: 'Recordings scored, then discarded' },
  { icon: 'badgeCheck', label: 'Never sold, never used to train models' },
];

export default function Compliance() {
  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-xs leading-relaxed text-muted">
        <span className="font-semibold text-fg">Your data stays yours.</span> Ntaka handles
        learner data under Nigeria&rsquo;s NDPA and the EU/UK GDPR.
      </p>

      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {POINTS.map((point) => (
          <li key={point.label} className="inline-flex items-center gap-1.5 text-2xs text-faint">
            <Icon name={point.icon} className="h-3.5 w-3.5 shrink-0 text-brand" />
            {point.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
