import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Flag from '@/components/common/Flag';
import LevelBadge from '@/components/common/LevelBadge';
import { cx } from '@/lib/format';
import { levelIndex } from '@/lib/cefr';
import { useAppSelector } from '@/app/hooks';
import { selectHistory } from '@/features/learner/learnerSlice';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { PageTitle, Panel, ComingSoon, StatTile } from '@/dashboard/components/Panel';

/**
 * Every placement attempt, newest first.
 *
 * A single level on a ladder is a snapshot; this is the story. Seeing A1 in March become
 * B1 in October is the most motivating thing the product can show a learner, and it is
 * the evidence a teacher wants before a first lesson.
 */
export default function TestHistory() {
  const history = useAppSelector(selectHistory);

  const byLanguage = history.reduce((acc, entry) => {
    (acc[entry.languageId] ??= []).push(entry);
    return acc;
  }, {});

  const climbed = history.filter(
    (e) => e.previousLevel && levelIndex(e.level) > levelIndex(e.previousLevel),
  ).length;

  return (
    <>
      <PageTitle
        title="Test history"
        description="Every placement you have taken, and how your level has moved."
        action={<Button to="/dashboard/placement">Take it again</Button>}
      />

      {history.length === 0 ? (
        <Panel>
          <ComingSoon
            title="No attempts yet"
            body="Take the placement test and every attempt will be kept here, so you can watch your level move over time."
            cta={{ to: '/dashboard/placement', label: 'Take the free test' }}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Attempts" value={history.length} icon="target" />
            <StatTile
              label="Languages"
              value={Object.keys(byLanguage).length}
              icon="globe"
            />
            <StatTile
              label="Levels gained"
              value={climbed}
              sub={climbed ? 'Keep going' : 'Retake to see movement'}
              icon="certificate"
              tone={climbed ? 'brand' : 'default'}
            />
          </div>

          <div className="mt-6 space-y-6">
            {Object.entries(byLanguage).map(([languageId, entries]) => {
              const language = LANGUAGES_FULL.find((l) => l.id === languageId);
              return (
                <Panel
                  key={languageId}
                  title={
                    <span className="flex items-center gap-2">
                      <Flag iso={language?.iso} size="xs" />
                      {entries[0].languageName ?? language?.name ?? languageId}
                    </span>
                  }
                  action={
                    <Link
                      to={`/languages/${languageId}`}
                      className="text-sm font-semibold text-brand hover:text-brand-hover"
                    >
                      Language page
                    </Link>
                  }
                >
                  <ol className="relative space-y-0">
                    {entries.map((entry, index) => (
                      <HistoryRow
                        key={entry.id}
                        entry={entry}
                        isLatest={index === 0}
                        isLast={index === entries.length - 1}
                      />
                    ))}
                  </ol>
                </Panel>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function HistoryRow({ entry, isLatest, isLast }) {
  const moved = entry.previousLevel
    ? levelIndex(entry.level) - levelIndex(entry.previousLevel)
    : null;

  const taken = new Date(entry.takenAt);

  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {/* timeline spine */}
      {!isLast && (
        <span className="absolute left-[7px] top-5 h-full w-px bg-line" aria-hidden="true" />
      )}
      <span
        className={cx(
          'relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-surface',
          isLatest ? 'bg-brand' : 'bg-line-strong',
        )}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge code={entry.level} />
          {moved > 0 && (
            <Badge tone="palm">
              <Icon name="arrowRight" className="h-3 w-3 -rotate-45" />
              up from {entry.previousLevel}
            </Badge>
          )}
          {moved === 0 && <Badge tone="neutral">held at {entry.previousLevel}</Badge>}
          {moved < 0 && <Badge tone="savanna">down from {entry.previousLevel}</Badge>}
          {isLatest && <Badge tone="clay">Current</Badge>}
        </div>

        <p className="nums mt-1.5 text-xs text-muted">
          {taken.toLocaleDateString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {' · '}
          {taken.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          {entry.mode === 'declared' ? ' · self-declared' : ` · confidence ${entry.confidence}`}
        </p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {entry.summary?.vocabulary && (
            <span className="nums">
              Vocabulary {entry.summary.vocabulary.correct}/{entry.summary.vocabulary.total}
            </span>
          )}
          {entry.summary?.writing && (
            <span className="nums">Writing {entry.summary.writing.words} words</span>
          )}
          {entry.summary?.speaking && (
            <span className="nums">
              Speaking {entry.summary.speaking.seconds}s over{' '}
              {entry.summary.speaking.prompts} prompts
            </span>
          )}
          {!entry.summary?.vocabulary &&
            !entry.summary?.writing &&
            !entry.summary?.speaking && <span>Level declared without a test</span>}
        </div>

        {entry.pendingReview?.length > 0 && (
          <p className="mt-1.5 text-2xs text-accent">
            {entry.pendingReview.join(' and ')} awaiting a teacher&rsquo;s review
          </p>
        )}
      </div>
    </li>
  );
}
