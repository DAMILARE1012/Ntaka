import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import LevelBadge from '@/components/common/LevelBadge';
import TeacherMiniCard from '@/features/teachers/components/TeacherMiniCard';
import RecommendedCourses from '@/features/learning/components/RecommendedCourses';
import PlacedLanguages from '@/features/placement/components/PlacedLanguages';
import MilestoneBoard, { useMilestoneProfile } from '@/features/motivation/components/MilestoneBoard';
import { evaluateMilestones } from '@/features/motivation/milestones';
import { useGetTeachersQuery, useSeedBookingsQuery } from '@/services/api';
import { useAppSelector } from '@/app/hooks';
import { selectLearner } from '@/features/learner/learnerSlice';
import { selectUser } from '@/dashboard/auth/authSlice';
import { getLanguage } from '@/services/mock/catalog';
import { getLevel } from '@/lib/cefr';
import { PageTitle, Panel, StatTile, ComingSoon } from '@/dashboard/components/Panel';
import BookingRow from '@/dashboard/components/BookingRow';

export default function LearnerOverview() {
  const user = useAppSelector(selectUser);
  const learner = useAppSelector(selectLearner);

  const focusId = learner.focusLanguageId;
  const placement = focusId ? learner.levels[focusId] : null;
  const language = focusId ? getLanguage(focusId) : null;

  const { data: teachers, isFetching: loadingTeachers } = useGetTeachersQuery({
    languageId: focusId || '',
    level: placement?.level ?? '',
    pageSize: 3,
  });
  const placedCount = Object.keys(learner.levels).length;

  const milestoneProfile = useMilestoneProfile();
  const milestones = evaluateMilestones(milestoneProfile);

  // Seeds a couple of lessons the first time, then just reads them back.
  const { data: upcoming } = useSeedBookingsQuery(
    { id: user.id, displayName: user.displayName },
    { skip: !user },
  );
  const nextLesson = upcoming?.[0];

  return (
    <>
      <PageTitle
        title={placement ? `Continue ${language?.name}` : 'Start learning'}
        description={
          placement
            ? getLevel(placement.level).summary
            : 'Take the free placement test and we will put you on the right rung of the CEFR ladder.'
        }
        action={
          placement ? (
            <Button to={`/teachers?language=${focusId}`}>Book a lesson</Button>
          ) : (
            <Button to="/dashboard/placement">
              <Icon name="target" className="h-4 w-4" />
              Take the free test
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Your level"
          value={placement?.level ?? '—'}
          sub={placement ? getLevel(placement.level).name : 'Not placed yet'}
          icon="target"
          tone={placement ? 'brand' : 'default'}
        />
        <StatTile label="Languages placed" value={placedCount} sub="of 25 available" icon="globe" />
        <StatTile
          label="Lessons booked"
          value={upcoming?.length ?? 0}
          sub={nextLesson ? 'Next one is scheduled' : 'Nothing booked yet'}
          icon="calendar"
          tone={upcoming?.length ? 'brand' : 'default'}
        />
        <StatTile
          label="Days practised"
          value={milestoneProfile.activeDays}
          sub={`${milestones.earned.length} of ${milestones.total} milestones`}
          icon="sparkles"
          tone={milestoneProfile.activeDays > 0 ? 'brand' : 'default'}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Panel
          title="Upcoming lessons"
          action={
            <Link
              to="/dashboard/lessons"
              className="text-sm font-semibold text-brand hover:text-brand-hover"
            >
              See all
            </Link>
          }
        >
          {upcoming?.length ? (
            <ul className="divide-y divide-line">
              {upcoming.slice(0, 3).map((booking) => (
                <BookingRow key={booking.id} booking={booking} as="learner" />
              ))}
            </ul>
          ) : (
            <ComingSoon
              title="No lessons booked"
              body="Pick a teacher, choose a time that works in your timezone, and it will show up here."
              cta={{ to: '/teachers', label: 'Find a teacher' }}
            />
          )}
        </Panel>

        {placement && (
          <Panel
            title={`${language?.name} teachers at ${placement.level}`}
            action={
              <Link
                to={`/teachers?language=${focusId}`}
                className="text-sm font-semibold text-brand hover:text-brand-hover"
              >
                See all
              </Link>
            }
          >
            {loadingTeachers && !teachers ? (
              <SkeletonGrid count={3} />
            ) : teachers?.items.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teachers.items.map((teacher) => (
                  <TeacherMiniCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No teachers match that level yet.</p>
            )}
          </Panel>
        )}

        {placement && (
          <Panel title="Study between lessons">
            {/* Ranked by the same comparator the placement result and the course listing
                use, so what the test recommended is what is waiting here. */}
            <RecommendedCourses
              heading={`Interactive courses for ${language?.name} at ${placement.level}`}
              languageId={focusId}
              limit={4}
            />
          </Panel>
        )}

        {placedCount > 0 && (
          <Panel title="Languages you have placed in">
            <PlacedLanguages />
          </Panel>
        )}

        <Panel
          title="Milestones"
          action={
            <Link
              to="/dashboard/milestones"
              className="text-sm font-semibold text-brand hover:text-brand-hover"
            >
              See all
            </Link>
          }
        >
          <MilestoneBoard compact limit={4} />
        </Panel>

        {!placement && (
          <Panel title="Where to begin">
            <p className="text-sm text-muted">
              Hello {user.displayName.split(' ')[0]} — the placement test is the first step, not
              an optional one. Lessons, classes and courses all unlock once we know your level,
              which takes about seven free minutes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button to="/dashboard/placement" size="sm">
                Take the placement test
              </Button>
              <Button to="/languages" variant="outline" size="sm">
                Browse languages
              </Button>
            </div>
          </Panel>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Panel title="Your CEFR ladder">
            <p className="text-sm text-muted">
              Every teacher, class and course on Ntaka is tagged to these six levels.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((code) => (
                <LevelBadge key={code} code={code} showName={false} />
              ))}
            </div>
          </Panel>

          <Panel title="Certificates">
            <p className="text-sm text-muted">
              Finish a video course and your certificate appears here. Course delivery is
              scheduled for a later phase.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
