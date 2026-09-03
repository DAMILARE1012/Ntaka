import { Link } from 'react-router-dom';
import { cx } from '@/lib/format';

const VARIANTS = {
  primary: 'bg-brand text-brand-fg shadow-sm hover:bg-brand-hover active:brightness-95',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
  outline: 'border border-line-strong bg-surface text-fg hover:border-brand-border hover:bg-brand-soft hover:text-brand',
  ghost: 'text-muted hover:bg-subtle hover:text-fg',
  subtle: 'bg-brand-soft text-brand ring-1 ring-inset ring-brand-border hover:bg-brand hover:text-brand-fg hover:ring-brand',
  light: 'bg-white text-ink-950 hover:bg-ink-100',
};

const SIZES = {
  sm: 'h-8 px-3.5 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-1.5',
  lg: 'h-11 px-6 text-md gap-2',
};

const BASE =
  'inline-flex items-center justify-center rounded-lg font-semibold tracking-[-0.005em] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap';

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}) {
  const classes = cx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  const Component = as ?? 'button';
  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
