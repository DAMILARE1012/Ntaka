export const formatPrice = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export const formatCompact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export const formatCount = (n) => new Intl.NumberFormat('en-US').format(n);

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatDay = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const initialsOf = (name) =>
  name
    .replace(/[^\p{L}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

/** Join conditional class names. */
export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const pluralize = (n, singular, plural = `${singular}s`) =>
  `${formatCount(n)} ${n === 1 ? singular : plural}`;
