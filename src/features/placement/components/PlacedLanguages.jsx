import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Flag from '@/components/common/Flag';
import LevelBadge from '@/components/common/LevelBadge';
import { useAppSelector } from '@/app/hooks';
import { selectLearner } from '@/features/learner/learnerSlice';
import { placedLanguages, unplacedLanguages } from '@/features/learning/recommend';
import { getLanguage, LANGUAGES_FULL } from '@/services/mock/catalog';
import { formatDay } from '@/lib/format';

/**
 * The learner's placement memory, made visible.
 *
 * The rule this renders is the one that governs the whole gate: a placement belongs to a
 * language, not to an account. Having tested in Yorùbá means never being asked to test in
 * Yorùbá again — but starting Igbo is a new language and needs its own result, because a
 * B1 in one says nothing at all about the other.
 *
 * Showing it rather than only enforcing it matters. A learner who is asked to take "the
 * free placement test" for a second time, having taken it last week, reasonably concludes
 * the platform lost their result. Naming the language they are being asked about is the
 * difference between a sensible request and a broken one.
 */
export default function PlacedLanguages({ className }) {
  const learner = useAppSelector(selectLearner);
  const placed = placedLanguages(learner.levels);
  const remaining = unplacedLanguages(learner.levels, LANGUAGES_FULL);

  if (!placed.length) return null;

  return (
    <div className={className}>
      <ul className="divide-y divide-line">
        {placed.map((entry) => {
          const language = getLanguage(entry.languageId);
          return (
            <li key={entry.languageId} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
              <Flag iso={language?.iso} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">{language?.name}</span>
                <span className="block text-2xs text-faint">
                  Placed {formatDay(entry.takenAt)}
                </span>
              </span>

              <LevelBadge code={entry.level} showName={false} />

              <span className="flex gap-2">
                <Link
                  to={`/dashboard/placement?language=${entry.languageId}`}
                  className="text-xs font-semibold text-muted transition-colors hover:text-brand"
                >
                  Retake
                </Link>
                <Link
                  to={`/interactive-learning?language=${entry.languageId}`}
                  className="text-xs font-semibold text-brand transition-colors hover:text-brand-hover"
                >
                  Courses
                </Link>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <p className="min-w-0 flex-1 text-xs text-muted">
          {remaining.length
            ? 'Learning another language means one more test — a level in one says nothing about another.'
            : 'You have placed in every language we teach. Nothing left to test.'}
        </p>
        {remaining.length > 0 && (
          <Button to="/dashboard/placement" variant="outline" size="sm">
            <Icon name="target" className="h-3.5 w-3.5" />
            Place another language
          </Button>
        )}
      </div>
    </div>
  );
}
