import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { cx, formatCount, formatPrice } from '@/lib/format';
import { LESSON_TYPES } from '@/lib/booking';
import { formatInZone, viewerTimezone } from '@/lib/timezone';
import { useGetSlotsQuery, useCreateBookingMutation } from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsSignedIn, selectUser, redirectRequested } from '@/dashboard/auth/authSlice';
import { ROLES } from '@/services/mock/accounts';
import SlotPicker from '@/features/booking/components/SlotPicker';

const TYPE_ORDER = ['trial', 'standard', 'long'];

/**
 * The booking box on a teacher's profile.
 *
 * Signed-out visitors see the real availability and prices — hiding them would cost
 * conversions — but the button sends them to sign in, remembering where they were so
 * they land back here afterwards.
 */
export default function BookingPanel({ teacher }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isSignedIn = useAppSelector(selectIsSignedIn);
  const user = useAppSelector(selectUser);

  const [lessonType, setLessonType] = useState('trial');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  const { data, isFetching } = useGetSlotsQuery({ teacherId: teacher.id, lessonType });
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();

  const type = LESSON_TYPES[lessonType];
  const tz = viewerTimezone();
  const isOwnProfile = user?.teacherId === teacher.id;

  const chooseType = (id) => {
    setLessonType(id);
    setSelected(null);
    setError('');
  };

  const confirm = async () => {
    setError('');
    if (!isSignedIn) {
      dispatch(redirectRequested(`/teachers/${teacher.id}`));
      navigate('/login');
      return;
    }
    try {
      const result = await createBooking({
        learner: { id: user.id, displayName: user.displayName },
        teacherId: teacher.id,
        startsAt: selected,
        lessonType,
      }).unwrap();
      setConfirmed(result);
      setSelected(null);
    } catch (err) {
      setError(err?.data ?? 'We could not complete that booking.');
    }
  };

  if (confirmed) {
    return <BookedConfirmation booking={confirmed} onAgain={() => setConfirmed(null)} />;
  }

  return (
    <div className="surface-card p-5 lg:sticky lg:top-20">
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
        Book a lesson
      </p>

      {/* ------------------------------------------------------ lesson type */}
      <div className="mt-3 grid gap-1.5">
        {TYPE_ORDER.map((id) => {
          const option = LESSON_TYPES[id];
          const price = id === 'trial'
            ? teacher.trialPrice
            : Math.round((teacher.hourlyRate * option.durationMin) / 60);
          const active = lessonType === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => chooseType(id)}
              aria-pressed={active}
              className={cx(
                'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                active
                  ? 'border-brand bg-brand-soft ring-1 ring-brand-border'
                  : 'border-line hover:border-line-strong',
              )}
            >
              <span>
                <span className="block text-sm font-semibold text-fg">{option.label}</span>
                <span className="block text-2xs text-muted">{option.durationMin} minutes</span>
              </span>
              <span className="nums font-display text-base font-semibold text-fg">
                {formatPrice(price)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ----------------------------------------------------------- slots */}
      <div className="mt-5 border-t border-line pt-5">
        <SlotPicker
          slots={data?.slots ?? []}
          teacherTimezone={data?.teacherTimezone ?? teacher.timezone}
          isLoading={isFetching && !data}
          value={selected}
          onChange={(startsAt) => {
            setSelected(startsAt);
            setError('');
          }}
        />
      </div>

      {/* --------------------------------------------------------- confirm */}
      {selected && (
        <div className="mt-4 rounded-lg bg-subtle p-3">
          <p className="text-sm font-semibold text-fg">
            {formatInZone(new Date(selected), tz, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </p>
          <p className="mt-0.5 text-2xs text-muted">
            {type.durationMin} minutes ·{' '}
            {formatInZone(new Date(selected), data?.teacherTimezone ?? teacher.timezone, {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}{' '}
            for {teacher.name.split(' ')[0]}
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {isOwnProfile ? (
        <p className="mt-4 rounded-lg bg-subtle px-3 py-2.5 text-sm text-muted">
          This is your own profile — this is what learners see.
        </p>
      ) : user?.role === ROLES.TEACHER ? (
        <p className="mt-4 rounded-lg bg-subtle px-3 py-2.5 text-sm text-muted">
          You are signed in as a teacher. Switch to a learner account to book.
        </p>
      ) : (
        <Button
          fullWidth
          size="lg"
          className="mt-4"
          onClick={confirm}
          disabled={booking || (isSignedIn && !selected)}
        >
          {booking
            ? 'Confirming…'
            : !isSignedIn
              ? 'Sign in to book'
              : selected
                ? `Confirm ${formatPrice(data?.price ?? teacher.trialPrice)}`
                : 'Pick a time'}
        </Button>
      )}

      <p className="mt-3 text-center text-2xs text-muted">
        Free cancellation up to 24 hours before. Payment is collected at the lesson while
        checkout is being wired up.
      </p>

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Responds in</dt>
          <dd className="font-semibold text-fg">{teacher.responseTime}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Attendance</dt>
          <dd className="font-semibold text-fg">{teacher.attendanceRate}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Students</dt>
          <dd className="nums font-semibold text-fg">{formatCount(teacher.students)}</dd>
        </div>
      </dl>
    </div>
  );
}

function BookedConfirmation({ booking, onAgain }) {
  const tz = viewerTimezone();
  return (
    <div className="surface-card p-5 lg:sticky lg:top-20">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon name="check" className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <h3 className="mt-3 text-lg font-semibold">Lesson booked</h3>
      <p className="mt-1.5 text-sm text-muted">
        {booking.lessonLabel} with {booking.teacherName}.
      </p>

      <p className="mt-4 rounded-lg bg-subtle p-3 text-sm font-semibold text-fg">
        {formatInZone(new Date(booking.startsAt), tz, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </p>

      <div className="mt-4 grid gap-2">
        <Button to="/dashboard" fullWidth>
          See it in your dashboard
        </Button>
        <Button variant="outline" fullWidth onClick={onAgain}>
          Book another
        </Button>
      </div>

      <p className="mt-3 text-center text-2xs text-muted">
        The room opens 10 minutes before the start.{' '}
        <Link to="/dashboard/lessons" className="font-semibold text-brand">
          My lessons
        </Link>
      </p>
    </div>
  );
}
