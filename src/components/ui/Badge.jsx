import { cx } from '@/lib/format';

const TONES = {
  neutral: 'bg-subtle text-muted ring-line',
  clay: 'bg-brand-soft text-brand ring-brand-border',
  adire: 'bg-subtle text-muted ring-line',
  savanna: 'bg-accent-soft text-accent ring-accent-border',
  palm: 'bg-brand-soft text-brand ring-brand-border',
  white: 'bg-white/90 text-ink-950 ring-white/50 backdrop-blur',
  dark: 'bg-ink-950/85 text-white ring-white/10 backdrop-blur',
};

export default function Badge({ tone = 'neutral', className, children, ...rest }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
