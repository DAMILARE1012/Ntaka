import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { cx } from '@/lib/format';
import { rng } from '@/lib/prng';

/**
 * Match each word to its meaning.
 *
 * Recall under mild pressure is what moves vocabulary from recognised to retrievable, so
 * the game times you and counts mistakes — but nothing is ever lost. A wrong pair just
 * flashes and resets. Punishing errors makes people stop playing, and a learner who
 * stops playing learns nothing.
 */
export default function MatchGame({ pairs = [], onFinish }) {
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedMeaning, setSelectedMeaning] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Shuffled once per set of pairs, deterministically, so a retry is the same puzzle.
  const meanings = useMemo(() => {
    const r = rng(`match:${pairs.map((p) => p.term).join('|')}`);
    return r.sample(pairs, pairs.length);
  }, [pairs]);

  const done = pairs.length > 0 && matched.length === pairs.length;

  useEffect(() => {
    if (done) return undefined;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [done, startedAt]);

  useEffect(() => {
    if (!selectedTerm || !selectedMeaning) return undefined;

    if (selectedTerm === selectedMeaning) {
      setMatched((m) => [...m, selectedTerm]);
      setSelectedTerm(null);
      setSelectedMeaning(null);
      return undefined;
    }

    // Hold the wrong pair on screen briefly: an instant reset reads as a bug.
    setWrong(true);
    setMistakes((n) => n + 1);
    const timer = setTimeout(() => {
      setWrong(false);
      setSelectedTerm(null);
      setSelectedMeaning(null);
    }, 650);
    return () => clearTimeout(timer);
  }, [selectedTerm, selectedMeaning]);

  if (!pairs.length) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong bg-subtle/50 p-6 text-center text-sm text-muted">
        No vocabulary set for this language yet.
      </p>
    );
  }

  const reset = () => {
    setMatched([]);
    setMistakes(0);
    setSelectedTerm(null);
    setSelectedMeaning(null);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-2xs font-semibold text-muted">
        <span className="nums">
          {matched.length} of {pairs.length} matched
        </span>
        <span className="nums flex items-center gap-3">
          <span>{mistakes} misses</span>
          <span className="flex items-center gap-1">
            <Icon name="clock" className="h-3 w-3" />
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
            {String(elapsed % 60).padStart(2, '0')}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Column
          heading="Word"
          items={pairs}
          render={(p) => p.term}
          display="font-display text-md font-semibold"
          matched={matched}
          selected={selectedTerm}
          wrong={wrong}
          onSelect={setSelectedTerm}
        />
        <Column
          heading="Meaning"
          items={meanings}
          render={(p) => p.meaning}
          display="text-sm"
          matched={matched}
          selected={selectedMeaning}
          wrong={wrong}
          onSelect={setSelectedMeaning}
        />
      </div>

      {done && (
        <div className="mt-5 rounded-xl border border-brand-border bg-brand-soft p-4 text-center">
          <p className="font-display text-lg font-semibold text-fg">All matched</p>
          <p className="nums mt-1 text-sm text-muted">
            {elapsed} seconds, {mistakes} {mistakes === 1 ? 'miss' : 'misses'}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => onFinish({ seconds: elapsed, mistakes, score: pairs.length })}>
              Continue
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              Play again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Column({ heading, items, render, display, matched, selected, wrong, onSelect }) {
  return (
    <div>
      <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
        {heading}
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const isMatched = matched.includes(item.term);
          const isSelected = selected === item.term;
          return (
            <li key={item.term}>
              <button
                type="button"
                disabled={isMatched}
                onClick={() => onSelect(item.term)}
                className={cx(
                  'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
                  display,
                  isMatched && 'border-brand-border bg-brand-soft text-muted opacity-60',
                  !isMatched && isSelected && wrong && 'border-danger bg-danger-soft',
                  !isMatched && isSelected && !wrong && 'border-brand bg-brand text-brand-fg',
                  !isMatched && !isSelected && 'border-line bg-surface text-fg hover:border-line-strong',
                )}
              >
                {render(item)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
