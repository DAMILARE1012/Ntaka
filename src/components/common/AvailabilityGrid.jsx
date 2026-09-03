import { TIME_BLOCKS, upcomingDays } from '@/lib/schedule';
import { cx } from '@/lib/format';

/**
 * Seven-day × six-block availability grid.
 * Green cells are open; the learner's own timezone label sits underneath.
 */
export default function AvailabilityGrid({
  availability = {},
  days = 7,
  compact = false,
  className,
  onSelect,
}) {
  const columns = upcomingDays(new Date(), days);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className={cx('w-full', className)}>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `auto repeat(${columns.length}, minmax(0, 1fr))` }}
        role="table"
        aria-label="Teacher availability for the next week"
      >
        {/* header row */}
        <span aria-hidden="true" />
        {columns.map((day) => (
          <div key={day.key} className="pb-1.5 text-center">
            <div
              className={cx(
                'text-2xs font-semibold uppercase',
                day.isToday ? 'text-brand' : 'text-muted',
              )}
            >
              {day.weekday}
            </div>
            <div
              className={cx(
                'text-xs font-semibold',
                day.isToday ? 'text-brand' : 'text-faint',
              )}
            >
              {day.dayOfMonth}
            </div>
          </div>
        ))}

        {/* one row per four-hour block */}
        {TIME_BLOCKS.map((block) => (
          <div key={block.id} className="contents">
            <div
              className={cx(
                'pr-2 text-right font-semibold text-faint',
                compact ? 'text-2xs' : 'text-2xs',
              )}
            >
              {block.label}
            </div>
            {columns.map((day) => {
              const open = (availability[day.key] ?? []).includes(block.id);
              const label = `${block.label} on ${day.weekday} ${day.dayOfMonth}`;
              return onSelect && open ? (
                <button
                  key={day.key + block.id}
                  type="button"
                  onClick={() => onSelect({ date: day.key, block: block.id })}
                  aria-label={`Book ${label}`}
                  className={cx(
                    'rounded-[3px] bg-brand transition-colors hover:bg-brand',
                    compact ? 'h-4' : 'h-5',
                  )}
                />
              ) : (
                <div
                  key={day.key + block.id}
                  title={open ? `Open · ${label}` : undefined}
                  className={cx(
                    'rounded-[3px]',
                    compact ? 'h-4' : 'h-5',
                    open ? 'bg-brand' : 'bg-subtle',
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-2.5 flex items-center justify-between text-2xs text-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-brand" /> Open
          <span className="ml-2 h-2.5 w-2.5 rounded-[2px] bg-subtle" /> Booked
        </span>
        <span>Times in {timezone}</span>
      </p>
    </div>
  );
}
