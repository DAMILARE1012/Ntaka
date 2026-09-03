import { Link } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import Rating from '@/components/ui/Rating';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';

/** Condensed teacher card for rails, related lists and placement recommendations. */
export default function TeacherMiniCard({ teacher }) {
  return (
    <article className="surface-card flex h-full flex-col p-5 transition-shadow hover:shadow-lift">
      <div className="flex items-center gap-3.5">
        <Avatar name={teacher.name} iso={teacher.iso} size="md" />
        <div className="min-w-0">
          <Link
            to={`/teachers/${teacher.id}`}
            className="flex items-center gap-1.5 truncate font-display font-semibold text-fg hover:text-brand"
          >
            {teacher.name}
            {teacher.verified && (
              <Icon name="badgeCheck" className="h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
            )}
          </Link>
          <p className="truncate text-xs font-semibold text-muted">
            {teacher.languageName} · {teacher.typeLabel}
          </p>
          <Rating value={teacher.rating} reviews={teacher.reviews} className="mt-1" />
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
        {teacher.headline}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="text-2xs text-muted">Trial from</p>
          <p className="font-display font-semibold text-fg">
            {formatPrice(teacher.trialPrice)}
          </p>
        </div>
        <Button to={`/teachers/${teacher.id}`} size="sm">
          Book trial
        </Button>
      </div>

      <p className="mt-2.5 flex items-center gap-1.5 text-2xs font-semibold text-brand">
        <Icon name="clock" className="h-3 w-3" />
        {teacher.nextAvailable}
      </p>
    </article>
  );
}
