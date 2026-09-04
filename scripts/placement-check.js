/* eslint-disable no-console */
import * as db from '@/services/mock/db';
import { QUESTION_BANKS, buildTest } from '@/services/mock/placement';
import { scoreWriting, summariseSpeaking, combine, CONFIDENCE } from '@/lib/placementScoring';
import { LANGUAGES } from '@/services/mock/catalog';

let fails = 0;
const check = (label, ok, extra = '') => {
  console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? '   ' + extra : ''));
  if (!ok) fails += 1;
};

console.log('--- every language has all three tasks ---');
let missing = 0;
for (const language of LANGUAGES) {
  const test = buildTest(language.id);
  if (!test.writingPrompt || test.speakingPrompts.length !== 2) missing += 1;
}
check('writing prompt + 2 speaking prompts everywhere', missing === 0, `${LANGUAGES.length} languages`);

const yoruba = buildTest('yoruba');
check('read-aloud prompt carries a target line', Boolean(yoruba.speakingPrompts[0].text), yoruba.speakingPrompts[0].text);
check('open prompt has no target line', !yoruba.speakingPrompts[1].text);
check('authored languages get expected vocabulary', yoruba.writingPrompt.expectedWords.length > 0);
check('unauthored languages still get a prompt', buildTest('lingala').writingPrompt.expectedWords.length === 0);

console.log('');
console.log('--- writing: measures what it can, claims no more ---');
const empty = scoreWriting({ response: '', prompt: yoruba.writingPrompt, language: yoruba.language });
check('blank writing is not scored', empty.scored === false && empty.attempted === false);

const thin = scoreWriting({ response: 'Mo wa', prompt: yoruba.writingPrompt, language: yoruba.language });
check('a two-word answer lands at A1', thin.level === 'A1', thin.signals.wordCount + ' words');

const decent = scoreWriting({
  response: 'Orúkọ mi ni Chinelo. Mo ń gbé ní Èkó. Mo fẹ́ kọ́ èdè Yorùbá.',
  prompt: yoruba.writingPrompt,
  language: yoruba.language,
});
check('a real paragraph lands higher', ['A2', 'B1'].includes(decent.level), decent.level);
check('diacritics are detected', decent.signals.usesDiacritics, decent.signals.diacriticCount + ' marks');
check('expected vocabulary is matched', decent.signals.expectedWordsFound > 0,
  `${decent.signals.expectedWordsFound}/${decent.signals.expectedWordsTotal}`);

const essay = scoreWriting({
  response: ('Orúkọ mi ni Chinelo. Mo ń gbé ní Èkó. ').repeat(20),
  prompt: yoruba.writingPrompt,
  language: yoruba.language,
});
check('WRITING NEVER CLAIMS ABOVE ITS CAP', essay.level === 'B1' && essay.cappedAt === 'B1',
  `${essay.signals.wordCount} words still only ${essay.level}`);
check('writing always flags for human review', essay.needsHumanReview === true);

console.log('');
console.log('--- speaking: captured, never graded ---');
const noAudio = summariseSpeaking([]);
check('no recordings means not attempted', noAudio.attempted === false);
check('SPEAKING IS NEVER SCORED', noAudio.scored === false);

const short = summariseSpeaking([{ promptId: 'speak-read', durationMs: 2000 }]);
check('a 2s clip is attempted but not substantial', short.attempted && !short.substantial);

const real = summariseSpeaking([
  { promptId: 'speak-read', durationMs: 9000 },
  { promptId: 'speak-free', durationMs: 24000 },
]);
check('two real clips count as substantial', real.substantial && real.promptsAnswered === 2, real.totalSeconds + 's');
check('speaking never returns a level', real.level === undefined);
check('speaking always flags for human review', real.needsHumanReview === true);

console.log('');
console.log('--- combining: never punishes, states its confidence ---');
const strongVocab = { scored: true, level: 'B2' };
check('vocabulary leads', combine({ vocabulary: strongVocab, writing: empty, speaking: noAudio, selfLevel: 'A1' }).level === 'B2');
check('a weak self-check cannot drag you down',
  combine({ vocabulary: strongVocab, writing: empty, speaking: noAudio, selfLevel: 'A1' }).level === 'B2');
check('a far stronger self-check nudges up one',
  combine({ vocabulary: { scored: true, level: 'A1' }, writing: empty, speaking: noAudio, selfLevel: 'C1' }).level === 'A2');
check('strong writing nudges up one',
  combine({ vocabulary: { scored: true, level: 'A1' }, writing: { scored: true, level: 'B1', cappedAt: 'B1' }, speaking: noAudio, selfLevel: 'A1' }).level === 'A2');

const full = combine({ vocabulary: strongVocab, writing: decent, speaking: real, selfLevel: 'B1' });
check('all three attempted gives high confidence', full.confidence === CONFIDENCE.HIGH, full.confidence);
const partial = combine({ vocabulary: strongVocab, writing: empty, speaking: noAudio, selfLevel: 'B1' });
check('skipping both gives medium at best', partial.confidence !== CONFIDENCE.HIGH, partial.confidence);
const none = combine({ vocabulary: null, writing: empty, speaking: noAudio, selfLevel: 'B1' });
check('nothing measured gives low confidence', none.confidence === CONFIDENCE.LOW, none.confidence);

console.log('');
console.log('--- end to end through the API layer ---');
const perfect = Object.fromEntries(QUESTION_BANKS.yoruba.map((q) => [q.id, q.answerId]));
const result = db.submitPlacement({
  languageId: 'yoruba',
  answers: perfect,
  selfChecked: ['A1', 'A2'],
  writingResponse: 'Orúkọ mi ni Chinelo. Mo ń gbé ní Èkó. Mo fẹ́ kọ́ èdè Yorùbá dáadáa.',
  recordings: [
    { promptId: 'speak-read', durationMs: 9000 },
    { promptId: 'speak-free', durationMs: 24000 },
  ],
});
check('a perfect paper still lands at C2', result.level === 'C2', result.level);
check('result carries all three skills', Boolean(result.skills.vocabulary && result.skills.writing && result.skills.speaking));
check('result states a confidence', Boolean(result.confidence), result.confidence);
check('result lists what a human must review', result.pendingReview.includes('speaking') && result.pendingReview.includes('writing'),
  result.pendingReview.join(' + '));
check('recommendations still returned', result.recommendedTeachers.length > 0);

const skipped = db.submitPlacement({
  languageId: 'yoruba',
  answers: Object.fromEntries(QUESTION_BANKS.yoruba.map((q) => [q.id, 'zz'])),
  selfChecked: [],
});
check('skipping everything still produces a usable result', skipped.level === 'A1' && Boolean(skipped.confidence), `${skipped.level}/${skipped.confidence}`);
check('nothing pending when nothing was attempted', skipped.pendingReview.length === 0);

const selfOnly = db.submitPlacement({ languageId: 'lingala', selfChecked: ['A1', 'A2', 'B1'] });
check('a language with no bank still places', selfOnly.level === 'B1', selfOnly.level);

console.log('');
console.log(fails ? fails + ' CHECK(S) FAILED' : 'PLACEMENT CHECKS OK');
if (fails) process.exitCode = 1;
