import { cx } from '@/lib/format';
import Icon from '@/components/ui/Icon';

export function SearchInput({ value, onChange, placeholder = 'Search', className, ...rest }) {
  return (
    <div className={cx('relative', className)}>
      <Icon
        name="search"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-sm text-fg placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-border"
        {...rest}
      />
    </div>
  );
}

export function Select({ value, onChange, options, label, className, ...rest }) {
  return (
    <label className={cx('relative block', className)}>
      {label && <span className="sr-only">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-full border border-line-strong bg-surface pl-4 pr-10 text-sm font-semibold text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-border"
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </label>
  );
}

export function Checkbox({ checked, onChange, label, description, className }) {
  return (
    <label className={cx('flex cursor-pointer items-start gap-3', className)}>
      <span
        className={cx(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          checked ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong bg-surface',
        )}
      >
        {checked && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span>
        <span className="block text-sm font-semibold text-fg">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** Pill-shaped toggle used across the filter bars. */
export function FilterPill({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
        active
          ? 'border-brand bg-brand-soft text-brand-hover'
          : 'border-line-strong bg-surface text-fg hover:border-line-strong hover:bg-subtle',
        className,
      )}
    >
      {children}
    </button>
  );
}
