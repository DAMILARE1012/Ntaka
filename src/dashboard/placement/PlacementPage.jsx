import Icon from '@/components/ui/Icon';
import PlacementWizard from '@/features/placement/components/PlacementWizard';

const REASSURANCE = [
  { icon: 'sparkles', text: 'Free, and it never expires' },
  { icon: 'clock', text: 'About seven minutes' },
  { icon: 'target', text: 'Placed on the CEFR scale, A1 to C2' },
];

/**
 * The placement test, inside the dashboard.
 *
 * It lives here rather than on the marketing site because it records audio, writes a
 * result against the learner's account and drives every recommendation afterwards — none
 * of which works for an anonymous visitor. /placement-test remains public as a landing
 * page that explains it and sends people here.
 */
export default function PlacementPage() {
  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-3.5rem)] bg-bg px-4 py-8 sm:-mx-6 sm:px-6">
      <div className="mx-auto mb-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
        {REASSURANCE.map((item) => (
          <span
            key={item.text}
            className="flex items-center gap-1.5 text-xs font-medium text-muted"
          >
            <Icon name={item.icon} className="h-3.5 w-3.5 text-brand" />
            {item.text}
          </span>
        ))}
      </div>

      <PlacementWizard />
    </div>
  );
}
