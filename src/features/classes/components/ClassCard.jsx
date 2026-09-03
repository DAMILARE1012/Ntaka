import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import LevelBadge from '@/components/common/LevelBadge';
import { cx, formatDateTime, formatDuration, formatPrice } from '@/lib/format';
import Flag from '@/components/common/Flag';

function SeatMeter({ taken, total }) {
  const pct = Math.round((taken / total) * 100);
  const left = total - taken;
  const tight = left <= 2;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-muted">
          {taken}/{total} seats taken
        </span>
        <span className={tight ? 'text-brand' : 'text-brand'}>
          {left > 0 ? `${left} left` : 'Full'}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className={cx('h-full rounded-full', tight ? 'bg-brand' : 'bg-brand')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Group class card — the class, the teacher, when it runs and how many seats are left. */
export default function ClassCard({ groupClass }) {
  const { teacher } = groupClass;
  const full = groupClass.seatsLeft <= 0;

  return (
    <article className="surface-card flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3 border-b border-line bg-subtle px-5 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
            <Flag iso={groupClass.iso} size="xs" />
            {groupClass.languageName}
          </p>
          <Link
            to={`/classes/${groupClass.id}`}
            className="mt-1 block font-display text-base font-semibold leading-snug text-fg hover:text-brand"
          >
            {groupClass.title}
          </Link>
        </div>
        <LevelBadge code={groupClass.level} showName={false} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {groupClass.description}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Icon name="calendar" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
            <div>
              <dt className="sr-only">Starts</dt>
              <dd className="font-semibold text-fg">
                {formatDateTime(groupClass.startsAt)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
            <div>
              <dt className="sr-only">Duration</dt>
              <dd className="font-semibold text-fg">
                {formatDuration(groupClass.durationMins)}
              </dd>
              <dd className="text-xs text-muted">{groupClass.recurrence}</dd>
            </div>
          </div>
        </dl>

        {teacher && (
          <Link
            to={`/teachers/${teacher.id}`}
            className="mt-4 flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-line-strong hover:bg-subtle"
          >
            <Avatar name={teacher.name} iso={teacher.iso} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{teacher.name}</p>
              <p className="truncate text-xs text-muted">{teacher.typeLabel}</p>
            </div>
            <Rating value={teacher.rating} reviews={teacher.reviews} showCount={false} />
          </Link>
        )}

        <div className="mt-4">
          <SeatMeter taken={groupClass.seatsTaken} total={groupClass.seatsTotal} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs text-muted">Per seat</p>
            <p className="font-display text-xl font-semibold text-fg">
              {formatPrice(groupClass.pricePerSeat)}
            </p>
          </div>
          {full ? (
            <Button variant="outline" size="sm">
              Join waitlist
            </Button>
          ) : (
            <Button to={`/classes/${groupClass.id}`} size="sm">
              Reserve a seat
            </Button>
          )}
        </div>

        {groupClass.isTrialFriendly && (
          <Badge tone="palm" className="mt-3 self-start">
            <Icon name="sparkles" className="h-3 w-3" />
            Good for first-timers
          </Badge>
        )}
      </div>
    </article>
  );
}
