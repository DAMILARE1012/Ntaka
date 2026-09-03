import { cx } from '@/lib/format';

export default function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-line/70', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="surface-card p-5">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-5 h-16 w-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, className = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={cx('grid gap-5', className)}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
