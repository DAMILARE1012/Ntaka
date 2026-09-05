import MilestoneBoard from '@/features/motivation/components/MilestoneBoard';
import { PageTitle, Panel } from '@/dashboard/components/Panel';

export default function MilestonesPage() {
  return (
    <>
      <PageTitle
        title="Milestones"
        description="Earned once, kept for good. There is no streak here to lose and nothing expires — a gap of a month costs you nothing."
      />
      <Panel title="Your progress">
        <MilestoneBoard />
      </Panel>
    </>
  );
}
