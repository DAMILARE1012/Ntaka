import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { cx, formatPrice } from '@/lib/format';
import { BOOKING_STATUS } from '@/lib/booking';
import { evaluateJoinWindow, JOIN_STATE, formatCountdown } from '@/lib/meetings';
import { formatInZone, viewerTimezone } from '@/lib/timezone';

const STATUS_TONE = {
  [BOOKING_STATUS.CONFIRMED]: 'palm',
  [BOOKING_STATUS.PENDING]: 'savanna',
  [BOOKING_STATUS.CANCELLED]: 'neutral',
  [BOOKING_STATUS.COMPLETED]: 'neutral',
};

/**
 * One lesson in a list. Shows the counterpart — a learner sees their teacher, a teacher
 * sees their student — so the same row works on both dashboards.
 */
export default function BookingRow({ booking, as = 'learner', onCancel, cancelling }) {
  const tz = viewerTimezone();
  const start = new Date(booking.startsAt);
  const cancelled = booking.status === BOOKING_STATUS.CANCELLED;
  const counterpartName = as === 'teacher' ? booking.learnerName : booking.teacherName;

  // Same rule the room and the server use, so the button never lies about access.
  const viewerId = as === 'teacher' ? booking.teacherId : booking.learnerId;
  const verdict = evaluateJoinWindow({ booking, userId: viewerId });
  const joinable = verdict.state === JOIN_STATE.OPEN;
  const opensSoon = verdict.state === JOIN_STATE.TOO_EARLY && verdict.msUntilOpen < 6 * 3600 * 1000;

  return (
    <li className={cx('flex flex-wrap items-center gap-3 py-4', cancelled && 'opacity-60')}>
      <Avatar
        name={counterpartName}
        iso={as === 'learner' ? booking.teacher?.iso : undefined}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          {as === 'learner' && booking.teacher ? (
            <Link
              to={`/teachers/${booking.teacher.id}`}
              className="truncate text-sm font-semibold text-fg hover:text-brand"
            >
              {counterpartName}
            </Link>
          ) : (
            <span className="truncate text-sm font-semibold text-fg">{counterpartName}</span>
          )}
          <Badge tone={STATUS_TONE[booking.status] ?? 'neutral'}>{booking.status}</Badge>
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {booking.lessonLabel} · {booking.languageName} · {booking.durationMin} min
        </p>
      </div>

      <div className="text-right">
        <p className="nums text-sm font-semibold text-fg">
          {formatInZone(start, tz, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </p>
        <p className="nums text-2xs text-muted">{formatPrice(booking.price)}</p>
      </div>

      <div className="flex w-full justify-end gap-2 sm:w-auto">
        {joinable && (
          <Button to={`/dashboard/lessons/${booking.id}/room`} size="sm">
            <Icon name="video" className="h-3.5 w-3.5" />
            {as === 'teacher' ? 'Start' : 'Join'}
          </Button>
        )}

        {opensSoon && (
          <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-muted">
            <Icon name="clock" className="h-3 w-3" />
            Opens {formatCountdown(verdict.msUntilOpen)}
          </span>
        )}

        {!cancelled && !booking.isPast && onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(booking)}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
        )}
      </div>

      {!cancelled && !booking.isPast && !booking.freeCancellation && (
        <p className="w-full text-2xs text-accent">
          Inside 24 hours — cancelling now would not be refundable once payments are live.
        </p>
      )}
    </li>
  );
}
