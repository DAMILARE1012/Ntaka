import { useId, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

/** Labelled input with inline error text. Used by both auth forms. */
export default function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
  placeholder,
  required = true,
}) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && revealed ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-fg">
        {label}
      </label>

      <div className="relative mt-1.5">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cx(
            'h-11 w-full rounded-lg border bg-surface px-3.5 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-2',
            isPassword && 'pr-11',
            error
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-line-strong focus:border-brand focus:ring-brand/20',
          )}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-colors hover:bg-subtle hover:text-fg"
          >
            <Icon name={revealed ? 'close' : 'compass'} className="h-4 w-4" />
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
