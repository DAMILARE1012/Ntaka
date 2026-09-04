/**
 * The Interactive Learning trajectory.
 *
 * The promise being tested is narrow and worth stating: every input a learner receives is
 * followed by a task that makes them produce language ABOUT THAT INPUT. Videos are
 * followed by a written prompt, conversations by a written comprehension question, and
 * passages by a spoken response. Nothing here checks that the arc is pretty — it checks
 * that a learner cannot listen to a conversation and then walk away without answering for
 * it, which is the whole reason the arc is fixed rather than shuffled.
 */
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom/server';
import { makeStore } from '../src/app/store.js';
import {
  buildCurriculum,
  flattenCurriculum,
  LESSON_TYPES,
  QUIZ_MODES,
  TASK_BASIS,
  LEARNING_ARC,
  arcFor,
} from '../src/services/mock/courseContent.js';
import {
  DIALOGUES,
  conversationFor,
  passageFor,
  transcriptOf,
  hasDialogues,
} from '../src/services/mock/dialogues.js';
import { buildComprehensionPrompt, parseComprehensionVerdict, isTranscribable } from '../src/lib/groqAssessment.js';
import { VIDEO_COURSES } from '../src/services/mock/videos.js';
import LessonStage from '../src/features/learning/components/LessonStage.jsx';

let failed = 0;
const ok = (label, cond, note = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}${note ? `   ${note}` : ''}`);
  if (!cond) failed += 1;
};

const INPUTS = new Set([LESSON_TYPES.VIDEO, LESSON_TYPES.AUDIO, LESSON_TYPES.READING]);

const courseFor = (languageId) => VIDEO_COURSES.find((c) => c.languageId === languageId);

/* ------------------------------------------------------------- the content */

console.log('\n--- authored material exists for the two target languages ---');
for (const languageId of ['yoruba', 'igbo']) {
  const set = DIALOGUES[languageId];
  ok(`${languageId} has conversations`, set.conversations.length >= 2);
  ok(`${languageId} has reading passages`, set.passages.length >= 2);
  ok(
    `${languageId} conversations are between two speakers`,
    set.conversations.every((c) => c.speakers.length === 2),
  );
  ok(
    `${languageId} conversations alternate speakers`,
    set.conversations.every((c) => c.lines.some((l, i) => i > 0 && l.speaker !== c.lines[i - 1].speaker)),
  );
  ok(
    `${languageId} every line has an English gloss`,
    set.conversations.every((c) => c.lines.every((l) => l.text && l.gloss)),
  );
  ok(
    `${languageId} every conversation carries a marking scheme`,
    set.conversations.every((c) => c.expectedPoints?.length >= 2 && c.comprehension?.instruction),
  );
  ok(
    `${languageId} every passage has a speaking task`,
    set.passages.every((p) => p.speaking?.instruction && p.speaking.guidingQuestions?.length >= 2),
  );
  ok(
    `${languageId} passages are glossed line for line`,
    set.passages.every((p) => p.body.length === p.gloss.length),
  );
}

/* ----------------------------------------------------------------- the arc */

console.log('\n--- the arc pairs every input with a task about it ---');
ok('the arc is fixed, not random', Array.isArray(LEARNING_ARC) && LEARNING_ARC.length === 7);
ok(
  'video is followed by writing',
  LEARNING_ARC[0].type === 'video' &&
    LEARNING_ARC[1].mode === 'write' &&
    LEARNING_ARC[1].basis === TASK_BASIS.VIDEO,
);
ok(
  'conversation is followed by writing about it',
  LEARNING_ARC[2].type === 'audio' &&
    LEARNING_ARC[2].basis === TASK_BASIS.CONVERSATION &&
    LEARNING_ARC[3].mode === 'write' &&
    LEARNING_ARC[3].basis === TASK_BASIS.CONVERSATION,
);
ok(
  'reading is followed by speaking about it',
  LEARNING_ARC[4].type === 'reading' &&
    LEARNING_ARC[5].mode === 'speak' &&
    LEARNING_ARC[5].basis === TASK_BASIS.READING,
);
ok('languages without dialogue get the fallback arc', arcFor('zulu') !== LEARNING_ARC);
ok('yoruba and igbo get the full arc', arcFor('yoruba') === LEARNING_ARC && arcFor('igbo') === LEARNING_ARC);

/* --------------------------------------------------- the built curriculum */

console.log('\n--- built courses honour it ---');
for (const languageId of ['yoruba', 'igbo']) {
  const course = courseFor(languageId);
  const modules = buildCurriculum(course);
  const lessons = flattenCurriculum(modules);

  ok(`${languageId}: no module ends on an input`, modules.every((m) => !INPUTS.has(m.lessons.at(-1).type)));

  const conversationLessons = lessons.filter((l) => l.audio?.conversation);
  ok(`${languageId}: the course contains conversations`, conversationLessons.length > 0, `${conversationLessons.length} found`);

  const readingLessons = lessons.filter((l) => l.reading?.passage);
  ok(`${languageId}: the course contains authored passages`, readingLessons.length > 0, `${readingLessons.length} found`);

  const comprehension = lessons.filter((l) => l.quiz?.basis === TASK_BASIS.CONVERSATION);
  ok(`${languageId}: conversations get a written comprehension task`, comprehension.length > 0);
  ok(
    `${languageId}: every comprehension task carries its transcript`,
    comprehension.every((l) => l.quiz.source?.transcript && l.quiz.source.expectedPoints?.length),
  );
  ok(
    `${languageId}: the transcript is the one the learner heard`,
    comprehension.every((l) => {
      const heard = lessons.find((x) => x.id === l.quiz.source.lessonId);
      return heard && transcriptOf(heard.audio.conversation) === l.quiz.source.transcript;
    }),
  );

  const speaking = lessons.filter((l) => l.quiz?.basis === TASK_BASIS.READING);
  ok(`${languageId}: passages get a spoken task`, speaking.length > 0);
  ok(
    `${languageId}: the spoken task is discussion, not read-aloud`,
    speaking.every((l) => l.quiz.prompt.kind === 'discuss'),
  );
  ok(
    `${languageId}: the spoken task points back at the passage`,
    speaking.every((l) => {
      const read = lessons.find((x) => x.id === l.quiz.source.lessonId);
      return read?.reading?.passage?.id === l.quiz.source.passageId;
    }),
  );

  // Determinism: a learner's syllabus must not reshuffle between visits.
  const again = flattenCurriculum(buildCurriculum(course));
  ok(
    `${languageId}: the syllabus is stable across builds`,
    JSON.stringify(again.map((l) => [l.id, l.type, l.quiz?.basis])) ===
      JSON.stringify(lessons.map((l) => [l.id, l.type, l.quiz?.basis])),
  );
}

/* ------------------------------------------------------------- the grading */

console.log('\n--- comprehension is graded separately from language ---');
const conversation = conversationFor('yoruba', 0);
const messages = buildComprehensionPrompt({
  languageName: 'Yorùbá',
  sourceKind: 'conversation',
  sourceTranscript: transcriptOf(conversation),
  question: conversation.comprehension.question,
  expectedPoints: conversation.expectedPoints,
  response: 'Adé fẹ́ ra ọ̀gẹ̀dẹ̀.',
});
ok('the prompt carries the transcript', messages[1].content.includes('Bísí'));
ok('the prompt carries the marking scheme', messages[1].content.includes(conversation.expectedPoints[0]));
ok('learner text is fenced as data', messages[1].content.includes('<learner_text>'));
ok('the source is fenced as data too', messages[1].content.includes('<source>'));
ok('the model is told to keep the two axes apart', messages[0].content.includes('Do not merge them'));
ok('"insufficient" remains an allowed answer', messages[0].content.includes('insufficient'));

const verdict = parseComprehensionVerdict(
  JSON.stringify({
    comprehension: {
      pointsCovered: [conversation.expectedPoints[0], 'a point nobody supplied'],
      pointsMissed: [conversation.expectedPoints[1]],
      score: 99,
      outOf: 99,
    },
    language: { level: 'A2', confidence: 'medium', languageDetected: 'target' },
    feedback: 'Good — now add the price.',
  }),
  conversation.expectedPoints,
);
ok('a valid verdict parses', Boolean(verdict));
ok('invented marking points are discarded', verdict.comprehension.pointsCovered.length === 1);
ok(
  'the score is derived, not trusted',
  verdict.comprehension.score === 1 && verdict.comprehension.outOf === conversation.expectedPoints.length,
);
ok('a malformed verdict returns null', parseComprehensionVerdict('{"nonsense":true}', []) === null);
ok('a missing language block returns null', parseComprehensionVerdict(JSON.stringify({ comprehension: {} }), []) === null);

/* ----------------------------------------------------------- Igbo speaking */

console.log('\n--- the Igbo speaking limit is still honoured ---');
ok('Yorùbá speech can be transcribed', isTranscribable('yoruba'));
ok('Igbo speech cannot, so it goes to a teacher', !isTranscribable('igbo'));

/* --------------------------------------------------------------- rendering */

console.log('\n--- it renders ---');
const render = (node) =>
  renderToString(
    <Provider store={makeStore()}>
      <StaticRouter location="/dashboard/learning">{node}</StaticRouter>
    </Provider>,
  ).replaceAll('<!-- -->', '');

for (const languageId of ['yoruba', 'igbo']) {
  const course = courseFor(languageId);
  const lessons = flattenCurriculum(buildCurriculum(course));

  const audio = lessons.find((l) => l.audio?.conversation);
  const audioHtml = render(<LessonStage lesson={audio} course={course} onComplete={() => {}} />);
  ok(`${languageId}: the conversation renders both speakers`, audio.audio.conversation.speakers.every((sp) => audioHtml.includes(sp.name)));
  ok(`${languageId}: the transcript starts hidden`, audioHtml.includes('Listen first'));

  const task = lessons.find((l) => l.quiz?.basis === TASK_BASIS.CONVERSATION);
  const taskHtml = render(<LessonStage lesson={task} course={course} onComplete={() => {}} />);
  ok(`${languageId}: the task says what it is about`, taskHtml.includes('About the conversation you just heard'));
  ok(`${languageId}: the question is shown in the target language`, taskHtml.includes(task.quiz.prompt.question));
  ok(`${languageId}: the learner can look at the source again`, taskHtml.includes('Look at it again'));

  const spoken = lessons.find((l) => l.quiz?.basis === TASK_BASIS.READING);
  const spokenHtml = render(<LessonStage lesson={spoken} course={course} onComplete={() => {}} />);
  ok(`${languageId}: the spoken task names its passage`, spokenHtml.includes('About the passage you just read'));
  ok(`${languageId}: guiding questions are shown`, spokenHtml.includes(spoken.quiz.prompt.guidingQuestions[0]));
}

console.log(failed ? `\nARC CHECKS FAILED (${failed})` : '\nARC CHECKS OK');
process.exit(failed ? 1 : 0);
