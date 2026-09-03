import { useAppSelector } from '@/app/hooks';
import PlacementWizard from '@/features/placement/components/PlacementWizard';
import { selectPlacement } from '@/features/placement/placementSlice';
import Icon from '@/components/ui/Icon';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';
import { graph, assessmentPage, breadcrumbs } from '@/lib/structuredData';

const REASSURANCE = [
  { icon: 'sparkles', text: 'Completely free, no account needed' },
  { icon: 'clock', text: 'About six minutes' },
  { icon: 'target', text: 'Placed on the CEFR scale, A1 to C2' },
];

export default function PlacementTestPage() {
  const { stage } = useAppSelector(selectPlacement);
  const isResult = stage === 'result';

  return (
    <div className="bg-bg">
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
      {!isResult && (
        <div className="border-b border-line bg-surface">
          <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4">
            {REASSURANCE.map((item) => (
              <span
                key={item.text}
                className="flex items-center gap-2 text-sm font-semibold text-muted"
              >
                <Icon name={item.icon} className="h-4 w-4 text-brand" />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="container py-12 md:py-16">
        <PlacementWizard />
      </div>
    </div>
  );
}
