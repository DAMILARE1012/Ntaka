import { useState } from 'react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { cx } from '@/lib/format';
import { useGetBookingsQuery, useCancelBookingMutation } from '@/services/api';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import { PageTitle, Panel, ComingSoon } from '@/dashboard/components/Panel';
import BookingRow from '@/dashboard/components/BookingRow';

const SCOPES = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past & cancelled' },
];

export default function MyLessons() {
  const user = useAppSelector(selectUser);
  const [scope, setScope] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);

  const { data: bookings, isFetching } = useGetBookingsQuery({
    learnerId: user.id,
    scope,
  });
  const [cancelBooking] = useCancelBookingMutation();

  const cancel = async (booking) => {
    setCancellingId(booking.id);
    try {
      await cancelBooking({ bookingId: booking.id, userId: user.id }).unwrap();
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <PageTitle
        title="My lessons"
        description="Everything you have booked, in your timezone."
        action={<Button to="/teachers">Book another</Button>}
      />

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
                as="learner"
                onCancel={scope === 'upcoming' ? cancel : undefined}
                cancelling={cancellingId === booking.id}
              />
            ))}
          </ul>
        ) : (
          <ComingSoon
            title={scope === 'upcoming' ? 'No lessons booked' : 'Nothing here yet'}
            body={
              scope === 'upcoming'
                ? 'Pick a teacher, choose a time that suits you, and it will show up here.'
                : 'Lessons you have taken or cancelled will be listed here.'
            }
            cta={scope === 'upcoming' ? { to: '/teachers', label: 'Find a teacher' } : undefined}
          />
        )}
      </Panel>
    </>
  );
}
