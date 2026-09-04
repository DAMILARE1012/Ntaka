import { useState } from 'react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { cx } from '@/lib/format';
import { useGetBookingsQuery, useCancelBookingMutation } from '@/services/api';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import { formatInZone, viewerTimezone, zonedDateKey } from '@/lib/timezone';
import { PageTitle, Panel, ComingSoon } from '@/dashboard/components/Panel';
import BookingRow from '@/dashboard/components/BookingRow';

const SCOPES = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past & cancelled' },
];

export default function SchedulePage() {
  const user = useAppSelector(selectUser);
  const [scope, setScope] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);

  const { data: bookings, isFetching } = useGetBookingsQuery(
    { teacherId: user.teacherId, scope },
    { skip: !user.teacherId },
  );
  const [cancelBooking] = useCancelBookingMutation();

  const cancel = async (booking) => {
    setCancellingId(booking.id);
    try {
      await cancelBooking({ bookingId: booking.id, userId: user.teacherId }).unwrap();
    } finally {
      setCancellingId(null);
    }
  };

  if (!user.teacherId) {
    return (
      <>
        <PageTitle title="Schedule" />
        <Panel>
          <p className="text-sm text-muted">
            Your teaching profile is still in review, so there is nothing scheduled yet.
          </p>
        </Panel>
      </>
    );
  }

  const tz = viewerTimezone();
  const todayKey = zonedDateKey(new Date(), tz);
  const today = (bookings ?? []).filter((b) => zonedDateKey(new Date(b.startsAt), tz) === todayKey);

  return (
    <>
      <PageTitle
        title="Schedule"
        description="Lessons learners have booked with you, in your timezone."
        action={<Button to="/dashboard/availability" variant="outline">Edit availability</Button>}
      />

      {scope === 'upcoming' && today.length > 0 && (
        <div className="mb-6">
          <Panel title={`Today · ${formatInZone(new Date(), tz, { weekday: 'long', day: 'numeric', month: 'long' })}`}>
            <ul className="divide-y divide-line">
              {today.map((booking) => (
                <BookingRow key={booking.id} booking={booking} as="teacher" />
              ))}
            </ul>
          </Panel>
        </div>
      )}

      <div className="mb-4 flex gap-1.5">
        {SCOPES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setScope(option.id)}
            aria-pressed={scope === option.id}
            className={cx(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              scope === option.id
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line bg-surface text-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Panel>
        {isFetching && !bookings ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : bookings?.length ? (
          <ul className="divide-y divide-line">
            {bookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                as="teacher"
                onCancel={scope === 'upcoming' ? cancel : undefined}
                cancelling={cancellingId === booking.id}
              />
            ))}
          </ul>
        ) : (
          <ComingSoon
            title={scope === 'upcoming' ? 'Nothing booked yet' : 'No history yet'}
            body={
              scope === 'upcoming'
                ? 'Publish more hours and learners can book them. Your open times are what learners see on your profile.'
                : 'Lessons you have taught or cancelled will appear here.'
            }
            cta={scope === 'upcoming' ? { to: '/dashboard/availability', label: 'Open more hours' } : undefined}
          />
        )}
      </Panel>
    </>
  );
}
