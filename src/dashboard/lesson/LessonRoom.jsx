import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { useGetBookingQuery, useJoinLessonMutation, useLeaveLessonMutation } from '@/services/api';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import { formatInZone, viewerTimezone } from '@/lib/timezone';
import {
  evaluateJoinWindow,
  formatCountdown,
  JOIN_STATE,
  JOIN_OPENS_BEFORE_MIN,
} from '@/lib/meetings';
import { PageTitle, Panel } from '@/dashboard/components/Panel';
import CallFrame from '@/features/meeting/components/CallFrame';

/**
 * The lesson room.
 *
 * The window check runs here as well as on the server, but only to decide what to
 * render — a countdown reads better than a rejection. The server's answer is the one
 * that grants or refuses a token, and it is checked again there on every request.
 */
export default function LessonRoom() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const tz = viewerTimezone();

  const { data: booking, isFetching, isError } = useGetBookingQuery(bookingId);
  const [joinLesson, { isLoading: joining }] = useJoinLessonMutation();
  const [leaveLesson] = useLeaveLessonMutation();

  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  // Re-evaluate every 10s so the countdown ticks and the button opens by itself.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  if (isFetching && !booking) {
    return (
      <>
        <PageTitle title="Lesson room" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </>
    );
  }

  if (isError || !booking) {
    return (
      <>
        <PageTitle title="Lesson room" />
        <Panel>
          <p className="text-sm text-muted">
            We could not find that lesson.{' '}
            <Link to="/dashboard/lessons" className="font-semibold text-brand">
              Back to my lessons
            </Link>
          </p>
        </Panel>
      </>
    );
  }

  const verdict = evaluateJoinWindow({ booking, userId: user.teacherId ?? user.id, now });
  const asTeacher = booking.teacherId === (user.teacherId ?? user.id);
  const counterpart = asTeacher ? booking.learnerName : booking.teacherName;

  const enter = async () => {
    setError('');
    try {
      const result = await joinLesson({
        bookingId,
        user: { id: user.teacherId ?? user.id, displayName: user.displayName },
      }).unwrap();
      setSession(result);
    } catch (err) {
      setError(err?.data ?? 'We could not let you in.');
    }
  };

  const leave = async () => {
    await leaveLesson({ bookingId, userId: user.teacherId ?? user.id });
    setSession(null);
    navigate('/dashboard/lessons');
  };

  return (
    <>
      <PageTitle
        title={session ? 'In lesson' : 'Lesson room'}
        description={`${booking.lessonLabel} · ${booking.languageName} · ${booking.durationMin} minutes`}
        action={
          <Button to="/dashboard/lessons" variant="outline">
            My lessons
          </Button>
        }
      />

      {session ? (
        <CallFrame session={session} onLeft={leave} />
      ) : (
        <Panel>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Avatar
              name={counterpart}
              iso={asTeacher ? undefined : booking.teacher?.iso}
              size="lg"
            />
            <div>
              <p className="font-display text-lg font-semibold text-fg">
                {asTeacher ? 'Teaching' : 'Lesson with'} {counterpart}
              </p>
              <p className="nums mt-1 text-sm text-muted">
                {formatInZone(new Date(booking.startsAt), tz, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>

            <JoinState
              verdict={verdict}
              asTeacher={asTeacher}
              joining={joining}
              onEnter={enter}
            />

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger"
              >
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </Panel>
      )}

      {session && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-sm text-muted">
            You joined as <span className="font-semibold text-fg">{session.role}</span>. Access
            expires {formatInZone(new Date(session.expiresAt), tz, { hour: '2-digit', minute: '2-digit', hour12: false })}.
          </p>
          <Button variant="outline" size="sm" onClick={leave}>
            Leave lesson
          </Button>
        </div>
      )}
    </>
  );
}

function JoinState({ verdict, asTeacher, joining, onEnter }) {
  if (verdict.state === JOIN_STATE.OPEN) {
    return (
      <>
        <Button size="lg" onClick={onEnter} disabled={joining}>
          <Icon name="video" className="h-4 w-4" />
          {joining ? 'Opening the room…' : asTeacher ? 'Start the lesson' : 'Join the lesson'}
        </Button>
        <p className="text-2xs text-muted">
          {asTeacher
            ? 'You join as host and can mute or remove participants.'
            : 'Your teacher hosts the room.'}
        </p>
      </>
    );
  }

  if (verdict.state === JOIN_STATE.TOO_EARLY) {
    return (
      <>
        <Badge tone="savanna">
          <Icon name="clock" className="h-3 w-3" />
          Opens {formatCountdown(verdict.msUntilOpen)}
        </Badge>
        <p className="max-w-sm text-sm text-muted">
          The room unlocks {JOIN_OPENS_BEFORE_MIN} minutes before the start. This page will open
          the button by itself — you can leave it here.
        </p>
      </>
    );
  }

  if (verdict.state === JOIN_STATE.EXPIRED) {
    return (
      <>
        <Badge tone="neutral">Lesson ended</Badge>
        <p className="max-w-sm text-sm text-muted">
          This room has closed. If something went wrong, cancel or rebook from your lessons.
        </p>
      </>
    );
  }

  if (verdict.state === JOIN_STATE.CANCELLED) {
    return (
      <>
        <Badge tone="neutral">Cancelled</Badge>
        <p className="max-w-sm text-sm text-muted">This lesson was cancelled.</p>
      </>
    );
  }

  return (
    <p className="max-w-sm text-sm text-danger">
      This lesson is not yours. If you think that is wrong, sign in with the account that booked it.
    </p>
  );
}
