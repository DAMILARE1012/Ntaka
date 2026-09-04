import { useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { cx } from '@/lib/format';
import { groupSlotsByViewerDay } from '@/lib/booking';
import { formatInZone, viewerTimezone, zoneAbbreviation } from '@/lib/timezone';

/**
 * Day strip plus a grid of start times.
 *
 * Every time on screen is rendered in the *learner's* timezone from a UTC instant. The
 * teacher's own local time is shown alongside the selection, because "18:00 your time,
 * 20:00 theirs" is the sentence that stops people booking a lesson at 3am for someone.
 */
export default function SlotPicker({
  slots = [],
  teacherTimezone,
  isLoading,
  value,
  onChange,
}) {
  const tz = viewerTimezone();
  const days = useMemo(() => groupSlotsByViewerDay(slots, tz), [slots, tz]);
  const [dayKey, setDayKey] = useState(null);

  const activeKey = dayKey && days.some((d) => d.key === dayKey) ? dayKey : days[0]?.key;
  const activeDay = days.find((d) => d.key === activeKey);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-subtle/50 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-fg">No open times in the next two weeks</p>
        <p className="mt-1 text-sm text-muted">
          Message the teacher and they can open a slot for you.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* -------------------------------------------------------- day strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {days.map((day) => {
          const date = new Date(day.slots[0].startsAt);
          const isActive = day.key === activeKey;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setDayKey(day.key)}
              aria-pressed={isActive}
              className={cx(
                'shrink-0 rounded-lg border px-3 py-2 text-center transition-colors',
                isActive
                  ? 'border-brand bg-brand text-brand-fg'
                  : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <span
                className={cx(
                  'block text-2xs font-semibold uppercase',
                  isActive ? 'text-brand-fg/80' : 'text-faint',
                )}
              >
                {formatInZone(date, tz, { weekday: 'short' })}
              </span>
              <span className="nums block text-sm font-semibold">
                {formatInZone(date, tz, { day: 'numeric' })}
              </span>
              <span
                className={cx(
                  'block text-2xs',
                  isActive ? 'text-brand-fg/80' : 'text-muted',
                )}
              >
                {day.slots.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ times */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {activeDay?.slots.map((slot) => {
          const isSelected = value === slot.startsAt;
          return (
            <button
              key={slot.startsAt}
              type="button"
              onClick={() => onChange(slot.startsAt)}
              aria-pressed={isSelected}
              className={cx(
                'nums rounded-lg border py-2 text-sm font-semibold transition-colors',
                isSelected
                  ? 'border-brand bg-brand text-brand-fg'
                  : 'border-line bg-surface text-fg hover:border-brand-border hover:bg-brand-soft',
              )}
            >
              {formatInZone(new Date(slot.startsAt), tz, {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-2xs text-muted">
        <Icon name="globe" className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          Times shown in your timezone, {tz} ({zoneAbbreviation(tz)}).
          {teacherTimezone && teacherTimezone !== tz && (
            <> The teacher is in {teacherTimezone}.</>
          )}
        </span>
      </p>
    </div>
  );
}
