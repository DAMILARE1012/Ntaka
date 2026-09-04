import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import Skeleton from '@/components/ui/Skeleton';
import AvailabilityGrid from '@/components/common/AvailabilityGrid';
import LevelBadge from '@/components/common/LevelBadge';
import { useGetTeacherQuery, useGetBookingsQuery } from '@/services/api';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import { formatCount, formatPrice } from '@/lib/format';
import { PageTitle, Panel, StatTile, ComingSoon } from '@/dashboard/components/Panel';
import BookingRow from '@/dashboard/components/BookingRow';

export default function TeacherOverview() {
  const user = useAppSelector(selectUser);
  const { data: teacher, isFetching } = useGetTeacherQuery(user.teacherId, {
    skip: !user.teacherId,
  });
  const { data: upcoming } = useGetBookingsQuery(
    { teacherId: user.teacherId, scope: 'upcoming' },
    { skip: !user.teacherId },
  );

  // A teacher who signed up in-session has no catalogue record and is awaiting review.
  if (!user.teacherId) {
    return <PendingApproval name={user.displayName} />;
  }

  if (isFetching || !teacher) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const grossEarnings = teacher.lessons * teacher.hourlyRate;

  return (
    <>
      <PageTitle
        title="Your teaching"
        description={`${teacher.languageName} · ${teacher.typeLabel} · teaching ${teacher.levels[0]}–${teacher.levels[teacher.levels.length - 1]}`}
        action={
          <Button to={`/teachers/${teacher.id}`} variant="outline">
            View public profile
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Rating"
          value={teacher.rating ? teacher.rating.toFixed(1) : 'New'}
          sub={teacher.reviews ? `${formatCount(teacher.reviews)} reviews` : 'No reviews yet'}
          icon="badgeCheck"
          tone="brand"
        />
        <StatTile
          label="Lessons taught"
          value={formatCount(teacher.lessons)}
          sub={`${formatCount(teacher.students)} students`}
          icon="users"
        />
        <StatTile
          label="Hourly rate"
          value={formatPrice(teacher.hourlyRate)}
          sub={`Trial ${formatPrice(teacher.trialPrice)}`}
          icon="book"
        />
        <StatTile
          label="Lifetime gross"
          value={formatPrice(grossEarnings)}
          sub="Payouts run weekly"
          icon="certificate"
        />
      </div>

      <div className="mt-6 space-y-6">
        <Panel
          title="Instant lessons"
          action={<Badge tone={teacher.instantLesson ? 'palm' : 'neutral'}>
            {teacher.instantLesson ? 'Enabled' : 'Off'}
          </Badge>}
        >
          <p className="text-sm text-muted">
            When this is on and you are marked available, learners can request a lesson that
            starts within minutes. The toggle becomes live once presence tracking lands — until
            then it reflects your catalogue setting.
          </p>
        </Panel>

        <Panel
          title="Your published availability"
          action={
            <span className="text-2xs font-semibold uppercase tracking-wide text-faint">
              Edit in Availability
            </span>
          }
        >
          <p className="mb-4 text-sm text-muted">
            This is what learners see on your profile. Green blocks are open.
          </p>
          <AvailabilityGrid availability={teacher.availability} />
        </Panel>

        <Panel
          title="Upcoming lessons"
          action={
            <Link
              to="/dashboard/schedule"
              className="text-sm font-semibold text-brand hover:text-brand-hover"
            >
              Full schedule
            </Link>
          }
        >
          {upcoming?.length ? (
            <ul className="divide-y divide-line">
              {upcoming.slice(0, 4).map((booking) => (
                <BookingRow key={booking.id} booking={booking} as="teacher" />
              ))}
            </ul>
          ) : (
            <ComingSoon
              title="Nothing booked yet"
              body="Learners book against the hours you publish. Open more and you will show up in more searches."
              cta={{ to: '/dashboard/availability', label: 'Edit availability' }}
            />
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Your group classes">
            {teacher.classes?.length ? (
              <ul className="divide-y divide-line">
                {teacher.classes.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <LevelBadge code={item.level} showName={false} />
                    <Link
                      to={`/classes/${item.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium text-fg hover:text-brand"
                    >
                      {item.title}
                    </Link>
                    <span className="shrink-0 text-xs text-muted">
                      {item.seatsTaken}/{item.seatsTotal}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">You have no scheduled classes.</p>
            )}
          </Panel>

          <Panel title="Your video courses">
            {teacher.courses?.length ? (
              <ul className="divide-y divide-line">
                {teacher.courses.map((course) => (
                  <li key={course.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Icon name="video" className="h-4 w-4 shrink-0 text-faint" />
                    <Link
                      to={`/video-learning/${course.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium text-fg hover:text-brand"
                    >
                      {course.title}
                    </Link>
                    <Rating value={course.rating} showCount={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">You have not published a course yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function PendingApproval({ name }) {
  return (
    <>
      <PageTitle
        title="Your application is in review"
        description="Thanks for applying to teach on Ntaka."
      />
      <Panel>
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Icon name="clock" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-fg">Hello {name.split(' ')[0]}</p>
            <p className="mt-1.5 text-sm text-muted">
              An admin reviews every teacher before they go live, so learners can trust that
              anyone listed is a genuine native or near-native speaker. You will get an email
              once your profile is approved, and this dashboard will fill in.
            </p>
            <p className="mt-3 text-sm text-muted">
              In the meantime, have a look at how approved teachers present themselves.
            </p>
            <Button to="/teachers" variant="outline" size="sm" className="mt-4">
              Browse teacher profiles
            </Button>
          </div>
        </div>
      </Panel>
    </>
  );
}
