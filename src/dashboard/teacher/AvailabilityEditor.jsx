import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { cx } from '@/lib/format';
import { minutesToClock, clockToMinutes, zoneAbbreviation } from '@/lib/timezone';
import {
  useGetAvailabilityQuery,
  useSaveAvailabilityRulesMutation,
  useAddAvailabilityExceptionMutation,
  useRemoveAvailabilityExceptionMutation,
} from '@/services/api';
import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/dashboard/auth/authSlice';
import { PageTitle, Panel } from '@/dashboard/components/Panel';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Weekly rules editor.
 *
 * Teachers think in "Tuesdays, 6 til 9". They should never see a slot list, and they
 * should never have to think about anyone else's timezone: everything on this screen is
 * their own wall clock. Conversion happens when a learner reads it.
 */
export default function AvailabilityEditor() {
  const user = useAppSelector(selectUser);
  const teacherId = user.teacherId;

  const { data, isFetching } = useGetAvailabilityQuery(teacherId, { skip: !teacherId });
  const [saveRules, { isLoading: saving }] = useSaveAvailabilityRulesMutation();
  const [addException] = useAddAvailabilityExceptionMutation();
  const [removeException] = useRemoveAvailabilityExceptionMutation();

  const [draft, setDraft] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [blackoutDate, setBlackoutDate] = useState('');

  useEffect(() => {
    if (data?.rules) {
      setDraft(data.rules.map((r) => ({ ...r })));
      setDirty(false);
    }
  }, [data]);

  if (!teacherId) {
    return (
      <>
        <PageTitle title="Availability" />
        <Panel>
          <p className="text-sm text-muted">
            Your teaching profile is still in review. Once approved you can publish your week here.
          </p>
        </Panel>
      </>
    );
  }

  if (isFetching && !data) {
    return (
      <>
        <PageTitle title="Availability" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </>
    );
  }

  const update = (index, patch) => {
    setDraft((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setDirty(true);
  };

  const addRule = (weekday) => {
    setDraft((rows) => [
      ...rows,
      { id: `new-${Date.now()}`, teacherId, weekday, startMinute: 9 * 60, endMinute: 12 * 60 },
    ]);
    setDirty(true);
  };

  const removeRule = (index) => {
    setDraft((rows) => rows.filter((_, i) => i !== index));
    setDirty(true);
  };

  const invalid = draft.filter((rule) => rule.endMinute <= rule.startMinute);

  const save = async () => {
    if (invalid.length) return;
    await saveRules({ teacherId, rules: draft }).unwrap();
    setDirty(false);
  };

  return (
    <>
      <PageTitle
        title="Availability"
        description={`Your working week, in your own time (${data.timezone}, ${zoneAbbreviation(data.timezone)}). Learners see it converted to theirs.`}
        action={
          <Button onClick={save} disabled={!dirty || saving || invalid.length > 0}>
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </Button>
        }
      />

      <Panel title="Weekly hours">
        <div className="space-y-4">
          {WEEKDAYS.map((label, weekday) => {
            const rows = draft
              .map((rule, index) => ({ rule, index }))
              .filter(({ rule }) => rule.weekday === weekday);

            return (
              <div key={label} className="flex flex-col gap-2 border-b border-line pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start">
                <p className="w-28 shrink-0 pt-2 text-sm font-semibold text-fg">{label}</p>

                <div className="flex-1 space-y-2">
                  {rows.length === 0 && (
                    <p className="pt-2 text-sm text-faint">Not working</p>
                  )}

                  {rows.map(({ rule, index }) => {
                    const bad = rule.endMinute <= rule.startMinute;
                    return (
                      <div key={rule.id} className="flex items-center gap-2">
                        <TimeInput
                          value={rule.startMinute}
                          onChange={(v) => update(index, { startMinute: v })}
                          invalid={bad}
                        />
                        <span className="text-sm text-muted">to</span>
                        <TimeInput
                          value={rule.endMinute}
                          onChange={(v) => update(index, { endMinute: v })}
                          invalid={bad}
                        />
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          aria-label={`Remove ${label} window`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Icon name="close" className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => addRule(weekday)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-hover"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Add hours
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {invalid.length > 0 && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
            A window must end after it starts. Fix the highlighted rows to save.
          </p>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="Days off">
          <p className="text-sm text-muted">
            Block a single date without touching your weekly pattern — travel, holidays, exams.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={blackoutDate}
              onChange={(e) => setBlackoutDate(e.target.value)}
              className="h-10 rounded-lg border border-line-strong bg-surface px-3 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={!blackoutDate}
              onClick={async () => {
                await addException({
                  teacherId,
                  exception: { date: blackoutDate, startMinute: 0, endMinute: 1440, isAvailable: false },
                }).unwrap();
                setBlackoutDate('');
              }}
            >
              Block this day
            </Button>
          </div>

          {data.exceptions.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {data.exceptions.map((exception) => (
                <li key={exception.id} className="flex items-center gap-3 py-2.5">
                  <Icon
                    name={exception.isAvailable ? 'plus' : 'minus'}
                    className={cx(
                      'h-4 w-4 shrink-0',
                      exception.isAvailable ? 'text-brand' : 'text-danger',
                    )}
                  />
                  <span className="nums flex-1 text-sm font-medium text-fg">{exception.date}</span>
                  <span className="text-xs text-muted">
                    {exception.isAvailable ? 'Extra hours' : 'Unavailable'}{' '}
                    {exception.startMinute === 0 && exception.endMinute === 1440
                      ? 'all day'
                      : `${minutesToClock(exception.startMinute)}–${minutesToClock(exception.endMinute)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeException({ teacherId, exceptionId: exception.id })}
                    aria-label={`Remove ${exception.date}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-subtle hover:text-fg"
                  >
                    <Icon name="close" className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function TimeInput({ value, onChange, invalid }) {
  return (
    <input
      type="time"
      step={900}
      value={minutesToClock(value)}
      onChange={(e) => onChange(clockToMinutes(e.target.value))}
      className={cx(
        'nums h-9 rounded-lg border bg-surface px-2.5 text-sm text-fg focus:outline-none focus:ring-2',
        invalid
          ? 'border-danger focus:ring-danger/20'
          : 'border-line-strong focus:border-brand focus:ring-brand/20',
      )}
    />
  );
}
