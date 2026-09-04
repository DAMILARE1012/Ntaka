import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Rating from '@/components/ui/Rating';
import LevelBadge from '@/components/common/LevelBadge';
import Flag from '@/components/common/Flag';
import { useGetPlatformStatsQuery, useGetTeachersQuery, useGetClassesQuery } from '@/services/api';
import { formatCompact, formatCount, formatDateTime } from '@/lib/format';
import { PageTitle, Panel, StatTile, ComingSoon } from '@/dashboard/components/Panel';

export default function AdminOverview() {
  const { data: stats } = useGetPlatformStatsQuery();
  const { data: newest } = useGetTeachersQuery({ sort: 'newest', pageSize: 5 });
  const { data: upcoming } = useGetClassesQuery({ sort: 'soonest', pageSize: 5 });

  return (
    <>
      <PageTitle
        title="Platform overview"
        description="Catalogue health and the queues that need a human."
      />

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Teachers" value={formatCount(stats.teachers)} icon="users" tone="brand" />
          <StatTile label="Languages" value={stats.languages} sub={`${stats.countries} countries`} icon="globe" />
          <StatTile label="Group classes" value={formatCount(stats.classes)} icon="calendar" />
          <StatTile
            label="Lessons delivered"
            value={formatCompact(stats.lessonsDelivered)}
            icon="certificate"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <Panel
          title="Teacher approvals"
          action={
            <span className="text-2xs font-semibold uppercase tracking-wide text-faint">
              Phase 2
            </span>
          }
        >
          <ComingSoon
            title="No pending applications"
            body="Sign-ups that choose 'I want to teach' will queue here for review before they appear in the public catalogue."
          />
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Newest teachers"
            action={
              <Link to="/teachers" className="text-sm font-semibold text-brand hover:text-brand-hover">
                All teachers
              </Link>
            }
          >
            {newest?.items.length ? (
              <ul className="divide-y divide-line">
                {newest.items.map((teacher) => (
                  <li key={teacher.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar name={teacher.name} iso={teacher.iso} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/teachers/${teacher.id}`}
                        className="block truncate text-sm font-medium text-fg hover:text-brand"
                      >
                        {teacher.name}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {teacher.languageName} · {teacher.typeLabel}
                      </p>
                    </div>
                    <Rating value={teacher.rating} showCount={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton className="h-40 w-full rounded-lg" />
            )}
          </Panel>

          <Panel
            title="Next classes"
            action={
              <Link to="/classes" className="text-sm font-semibold text-brand hover:text-brand-hover">
                All classes
              </Link>
            }
          >
            {upcoming?.items.length ? (
              <ul className="divide-y divide-line">
                {upcoming.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Flag iso={item.iso} size="xs" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/classes/${item.id}`}
                        className="block truncate text-sm font-medium text-fg hover:text-brand"
                      >
                        {item.title}
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {formatDateTime(item.startsAt)}
                      </p>
                    </div>
                    <LevelBadge code={item.level} showName={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <Skeleton className="h-40 w-full rounded-lg" />
            )}
          </Panel>
        </div>

        <Panel title="Weekly payouts">
          <div className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-faint">
              <Icon name="book" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted">
                Payouts are manual at launch: learners are charged automatically, balances
                accumulate in the teacher ledger, and you settle by bank transfer once a week.
                This panel will show the batch to pay.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
