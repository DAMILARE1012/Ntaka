import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { cx } from '@/lib/format';

/**
 * A two-speaker conversation.
 *
 * The transcript starts hidden, and that is the pedagogy rather than a flourish. A learner
 * who reads along while listening is reading, not listening, and the writing task that
 * follows is meant to test what they heard. Revealing it is one click away because there
 * is no point pretending we can stop them — but the default should make the harder,
 * useful thing the easy one.
 *
 * English glosses are behind a second, separate toggle for the same reason: seeing the
 * translation next to the line removes the work of understanding it.
 */
export default function ConversationPlayer({ conversation, onListened, listened }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showGloss, setShowGloss] = useState(false);

  const speakerOf = (id) => conversation.speakers.find((s) => s.id === id);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="palm">
          <Icon name="headphones" className="h-3.5 w-3.5" />
          Conversation
        </Badge>
        <Badge tone="neutral">{conversation.level}</Badge>
        <span className="text-2xs text-faint">
          {conversation.speakers.map((s) => s.name).join(' and ')}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold text-fg">{conversation.title}</h3>
      <p className="mt-1 text-sm text-muted">{conversation.setting}</p>

      {/* The stand-in for real audio. Honest about what it is rather than a dead player. */}
      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-subtle p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
          <Icon name="play" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">
            {conversation.lines.length} lines between two speakers
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Recorded audio is not attached yet. Read the exchange aloud in both voices — you
            will still be asked what was said.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant={showTranscript ? 'outline' : 'subtle'}
          size="sm"
          onClick={() => setShowTranscript((v) => !v)}
        >
          <Icon name="book" className="h-3.5 w-3.5" />
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </Button>
        {showTranscript && (
          <Button variant="ghost" size="sm" onClick={() => setShowGloss((v) => !v)}>
            {showGloss ? 'Hide English' : 'Show English'}
          </Button>
        )}
      </div>

      {showTranscript ? (
        <ol className="mt-4 space-y-3">
          {conversation.lines.map((line, index) => {
            const speaker = speakerOf(line.speaker);
            const isFirst = line.speaker === conversation.speakers[0].id;
            return (
              <li
                key={`${line.speaker}-${index}`}
                className={cx('flex gap-3', isFirst ? '' : 'flex-row-reverse text-right')}
              >
                <span
                  className={cx(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-2xs font-semibold',
                    isFirst ? 'bg-brand-soft text-brand' : 'bg-subtle text-muted',
                  )}
                >
                  {speaker?.name?.[0] ?? '?'}
                </span>
                <span className="min-w-0">
                  <span className="block text-2xs font-semibold uppercase tracking-wide text-faint">
                    {speaker?.name}
                  </span>
                  <span className="mt-0.5 block font-display text-md leading-relaxed text-fg">
                    {line.text}
                  </span>
                  {showGloss && (
                    <span className="mt-0.5 block text-sm italic text-muted">{line.gloss}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          Listen first. The transcript is here when you want to check yourself.
        </p>
      )}

      {onListened && (
        <Button className="mt-6" disabled={listened} onClick={onListened}>
          {listened ? 'Done' : 'I have listened'}
          {!listened && <Icon name="arrowRight" className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
