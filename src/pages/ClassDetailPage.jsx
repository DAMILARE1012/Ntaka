import { Link, useParams } from 'react-router-dom';
import { useGetClassQuery } from '@/services/api';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import Skeleton from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import LevelBadge from '@/components/common/LevelBadge';
import ClassCard from '@/features/classes/components/ClassCard';
import { getLevel } from '@/lib/cefr';
import { formatDateTime, formatDuration, formatPrice } from '@/lib/format';
import Flag from '@/components/common/Flag';
import Seo from '@/components/common/Seo';
import { classSeo } from '@/lib/seo';
import { graph, groupClass, breadcrumbs } from '@/lib/structuredData';

export default function ClassDetailPage() {
  const { classId } = useParams();
  const { data: item, isLoading, isError, refetch } = useGetClassQuery(classId);

  if (isError) {
    return (
      <div className="container py-14">
        <ErrorState onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !item) {
    return (
      <div className="container grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const level = getLevel(item.level);
  const full = item.seatsLeft <= 0;

  return (
    <>
      <Seo
        {...classSeo(item)}
        jsonLd={graph(
          groupClass(item),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Group classes', path: '/classes' },
            { name: item.languageName, path: `/languages/${item.languageId}` },
            { name: item.title, path: `/classes/${item.id}` },
          ]),
        )}
      />

      <div className="border-b border-line bg-surface">
        <div className="container py-8">
          <Link to={`/classes?language=${item.languageId}`} className="link-arrow mb-5 inline-flex">
            <Icon name="arrowLeft" className="h-4 w-4" />
            All {item.languageName} classes
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="clay">
              <Flag iso={item.iso} size="xs" />
              {item.languageName}
            </Badge>
            <LevelBadge code={item.level} />
            <Badge tone="neutral">{item.topicLabel}</Badge>
          </div>

          <h1 className="mt-4 text-balance font-display text-2xl font-semibold sm:text-3xl">
            {item.title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{item.description}</p>
        </div>
      </div>

      <div className="container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-10">
          <section className="surface-card grid gap-5 p-6 sm:grid-cols-2">
            {[
              { icon: 'calendar', label: 'First session', value: formatDateTime(item.startsAt) },
              { icon: 'clock', label: 'Length', value: formatDuration(item.durationMins) },
              { icon: 'users', label: 'Class size', value: `${item.seatsTotal} learners max` },
              { icon: 'book', label: 'Format', value: item.recurrence },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted">
                  <Icon name={row.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                    {row.label}
                  </p>
                  <p className="font-semibold text-fg">{row.value}</p>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Who this class is for</h2>
            <p className="mt-2 text-muted">
              This class is pitched at {level.code} · {level.name}. {level.summary}
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {level.canDo.map((canDo) => (
                <li
                  key={canDo}
                  className="flex items-start gap-2.5 rounded-xl border border-line bg-surface p-4 text-sm text-fg"
                >
                  <Icon
                    name="check"
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                    strokeWidth={2.5}
                  />
                  {canDo}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Not sure this is your level?{' '}
              <Link to="/placement-test" className="font-semibold text-brand hover:text-brand-hover">
                Take the free placement test
              </Link>
              .
            </p>
          </section>

          {item.teacher && (
            <section>
              <h2 className="text-lg font-semibold">Your teacher</h2>
              <div className="surface-card mt-4 flex flex-wrap items-center gap-5 p-6">
                <Avatar name={item.teacher.name} iso={item.teacher.iso} size="lg" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/teachers/${item.teacher.id}`}
                    className="font-display text-lg font-semibold text-fg hover:text-brand"
                  >
                    {item.teacher.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {item.teacher.typeLabel} · {item.teacher.country}
                  </p>
                  <Rating
                    value={item.teacher.rating}
                    reviews={item.teacher.reviews}
                    className="mt-1.5"
                  />
                  <p className="mt-2 text-sm text-muted">{item.teacher.headline}</p>
                </div>
                <Button to={`/teachers/${item.teacher.id}`} variant="outline" size="sm">
                  View profile
                </Button>
              </div>
            </section>
          )}

          {item.related?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">More {item.languageName} classes</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {item.related.map((related) => (
                  <ClassCard key={related.id} groupClass={related} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="surface-card h-fit p-5 lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Per seat</p>
          <p className="mt-1 font-display text-2xl font-semibold text-fg">
            {formatPrice(item.pricePerSeat)}
          </p>
          <p className="text-sm text-muted">
            {item.sessionCount > 1 ? `per session · ${item.sessionCount} sessions` : 'one session'}
          </p>

          <div className="mt-4 rounded-xl bg-subtle p-4">
            <p className="flex items-center justify-between text-sm">
              <span className="text-muted">Seats taken</span>
              <span className="font-semibold text-fg">
                {item.seatsTaken}/{item.seatsTotal}
              </span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div
                className={item.seatsLeft <= 2 ? 'h-full bg-brand' : 'h-full bg-brand'}
                style={{ width: `${(item.seatsTaken / item.seatsTotal) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-muted">
              {full ? 'This class is full — join the waitlist' : `${item.seatsLeft} seats left`}
            </p>
          </div>

          <Button fullWidth size="lg" className="mt-4" variant={full ? 'outline' : 'primary'}>
            {full ? 'Join the waitlist' : 'Reserve my seat'}
          </Button>

          <p className="mt-3 text-center text-xs text-muted">
            Free cancellation up to 24 hours before the first session.
          </p>
        </aside>
      </div>
    </>
  );
}
