import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';

/** Windowed page list: 1 … 4 5 6 … 12 */
function pageWindow(page, totalPages) {
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onChange, className }) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);

  return (
    <nav className={cx('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition-colors hover:bg-subtle disabled:opacity-40 disabled:hover:bg-surface"
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" className="h-4 w-4" />
      </button>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-faint">…</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cx(
              'h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition-colors',
              p === page
                ? 'bg-ink-900 text-white'
                : 'border border-line-strong bg-surface text-fg hover:bg-subtle',
            )}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition-colors hover:bg-subtle disabled:opacity-40 disabled:hover:bg-surface"
        aria-label="Next page"
      >
        <Icon name="chevronRight" className="h-4 w-4" />
      </button>
    </nav>
  );
}
