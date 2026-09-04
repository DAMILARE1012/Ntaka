import { rng } from '@/lib/prng';
import { getLanguage } from '@/services/mock/catalog';
import { QUESTION_BANKS } from '@/services/mock/placement';
import { writingPromptFor, speakingPromptsFor } from '@/services/mock/placementTasks';
import {
  conversationFor,
  passageFor,
  hasDialogues,
  transcriptOf,
} from '@/services/mock/dialogues';

/**
 * Lesson content for Interactive Learning.
 *
 * The order is the pedagogy, so it is fixed rather than shuffled. Every input is followed
 * immediately by a task that makes the learner PRODUCE language about that specific input:
 *
 *   1. video          watch a teacher work through the topic
 *   2. write          answer a prompt question about what was taught      -> writing
 *   3. conversation   listen to two people talking, with a hidden transcript
 *   4. write          answer a question about what was said               -> writing
 *   5. reading        read a short passage
 *   6. speak          talk about the passage in your own words            -> speaking
 *   7. game           recall under mild pressure, which is what fixes vocabulary
 *
 * The pairing is the whole point. A comprehension question about a conversation the
 * learner just heard tests understanding in a way that repeating a phrase never does, and
 * asking them to speak about a passage rather than read it aloud tests whether they can
 * use the language rather than pronounce it.
 *
 * Steps 3-6 need authored dialogue in the target language. Yorùbá and Igbo have it; other
 * languages fall back to phrase drills rather than being given invented content, which
 * would be worse than nothing for someone trying to learn.
 *
 * A `checkpoint` can sit at the end of any module: a short assessment that reports back
 * into the learner's level, so placement is continuous rather than a one-off gate.
 */

export const LESSON_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  READING: 'reading',
  QUIZ: 'quiz',
  GAME: 'game',
};

export const QUIZ_MODES = {
  RECOGNISE: 'recognise',
  WRITE: 'write',
  SPEAK: 'speak',
};

/**
 * What a production task is *about*. The channel (write / speak) says how the learner
 * answers; the basis says what they are answering about, and therefore what the answer is
 * marked against - an open prompt is marked on language alone, while a conversation or
 * passage answer is marked on comprehension as well.
 */
export const TASK_BASIS = {
  OPEN: 'open',
  VIDEO: 'video',
  CONVERSATION: 'conversation',
  READING: 'reading',
};

/**
 * The fixed arc. Lessons are laid onto it in order and it repeats, so a module of any
 * length still runs input -> production, input -> production, and never ends on an input.
 */
export const LEARNING_ARC = [
  { type: 'video', basis: TASK_BASIS.OPEN },
  { type: 'quiz', mode: 'write', basis: TASK_BASIS.VIDEO },
  { type: 'audio', basis: TASK_BASIS.CONVERSATION },
  { type: 'quiz', mode: 'write', basis: TASK_BASIS.CONVERSATION },
  { type: 'reading', basis: TASK_BASIS.READING },
  { type: 'quiz', mode: 'speak', basis: TASK_BASIS.READING },
  { type: 'game', basis: TASK_BASIS.OPEN },
];

/** The arc without the steps that need authored dialogue, for other languages. */
export const FALLBACK_ARC = [
  { type: 'video', basis: TASK_BASIS.OPEN },
  { type: 'quiz', mode: 'write', basis: TASK_BASIS.VIDEO },
  { type: 'audio', basis: TASK_BASIS.OPEN },
  { type: 'quiz', mode: 'recognise', basis: TASK_BASIS.OPEN },
  { type: 'reading', basis: TASK_BASIS.OPEN },
  { type: 'quiz', mode: 'speak', basis: TASK_BASIS.OPEN },
  { type: 'game', basis: TASK_BASIS.OPEN },
];

export const arcFor = (languageId) => (hasDialogues(languageId) ? LEARNING_ARC : FALLBACK_ARC);

/**
 * Vocabulary used by games, audio drills and reading glossaries.
 * Authored for the languages with question banks; everything else degrades to the
 * greeting alone rather than shipping invented words.
 */
const VOCABULARY = {
  yoruba: [
    { term: 'Ẹ n lẹ o', meaning: 'Hello' },
    { term: 'Ẹ ṣé', meaning: 'Thank you' },
    { term: 'Jọ̀wọ́', meaning: 'Please' },
    { term: 'Ó dàbọ̀', meaning: 'Goodbye' },
    { term: 'Ilé', meaning: 'House' },
    { term: 'Omi', meaning: 'Water' },
    { term: 'Oúnjẹ', meaning: 'Food' },
    { term: 'Ọjà', meaning: 'Market' },
  ],
  igbo: [
    { term: 'Kedu', meaning: 'How are you' },
    { term: 'Daalụ', meaning: 'Thank you' },
    { term: 'Biko', meaning: 'Please' },
    { term: 'Ka ọ dị', meaning: 'Goodbye' },
    { term: 'Ụlọ', meaning: 'House' },
    { term: 'Mmiri', meaning: 'Water' },
    { term: 'Nri', meaning: 'Food' },
    { term: 'Ahịa', meaning: 'Market' },
  ],
  hausa: [
    { term: 'Sannu', meaning: 'Hello' },
    { term: 'Na gode', meaning: 'Thank you' },
    { term: 'Don Allah', meaning: 'Please' },
    { term: 'Sai anjima', meaning: 'See you later' },
    { term: 'Gida', meaning: 'House' },
    { term: 'Ruwa', meaning: 'Water' },
    { term: 'Abinci', meaning: 'Food' },
    { term: 'Kasuwa', meaning: 'Market' },
  ],
  swahili: [
    { term: 'Habari', meaning: 'Hello / how are you' },
    { term: 'Asante', meaning: 'Thank you' },
    { term: 'Tafadhali', meaning: 'Please' },
    { term: 'Kwaheri', meaning: 'Goodbye' },
    { term: 'Nyumba', meaning: 'House' },
    { term: 'Maji', meaning: 'Water' },
    { term: 'Chakula', meaning: 'Food' },
    { term: 'Soko', meaning: 'Market' },
  ],
  zulu: [
    { term: 'Sawubona', meaning: 'Hello' },
    { term: 'Ngiyabonga', meaning: 'Thank you' },
    { term: 'Ngicela', meaning: 'Please' },
    { term: 'Sala kahle', meaning: 'Goodbye' },
    { term: 'Indlu', meaning: 'House' },
    { term: 'Amanzi', meaning: 'Water' },
    { term: 'Ukudla', meaning: 'Food' },
  ],
  twi: [
    { term: 'Ɛte sɛn', meaning: 'How are you' },
    { term: 'Medaase', meaning: 'Thank you' },
    { term: 'Mepa wo kyɛw', meaning: 'Please' },
    { term: 'Akwaaba', meaning: 'Welcome' },
    { term: 'Efie', meaning: 'House' },
    { term: 'Nsuo', meaning: 'Water' },
    { term: 'Aduane', meaning: 'Food' },
  ],
  wolof: [
    { term: 'Na nga def', meaning: 'How are you' },
    { term: 'Jërëjëf', meaning: 'Thank you' },
    { term: 'Bul ko def', meaning: 'Please' },
    { term: 'Ba beneen', meaning: 'Goodbye' },
    { term: 'Kër', meaning: 'House' },
    { term: 'Ndox', meaning: 'Water' },
  ],
  amharic: [
    { term: 'ሰላም', meaning: 'Hello / peace' },
    { term: 'አመሰግናለሁ', meaning: 'Thank you' },
    { term: 'እባክህ', meaning: 'Please' },
    { term: 'ቤት', meaning: 'House' },
    { term: 'ውሃ', meaning: 'Water' },
    { term: 'ምግብ', meaning: 'Food' },
  ],
};

export function vocabularyFor(languageId) {
  const authored = VOCABULARY[languageId];
  if (authored) return authored;
  const language = getLanguage(languageId);
  // No invented words: one real greeting beats eight plausible fictions.
  return language ? [{ term: language.greeting, meaning: 'Hello' }] : [];
}

/* ------------------------------------------------------------------ lessons */

/**
 * Build the production task for one arc step.
 *
 * The `source` field is what makes this work. A task that is about a conversation carries
 * that conversation's transcript and its marking scheme, so the grader can ask "did they
 * understand it?" rather than only "is the grammar right?". Without it, a comprehension
 * question is indistinguishable from an open writing prompt.
 */
function quizFor({ step, languageId, languageName, title, moduleIndex, priorLessons, r }) {
  const lastWhere = (fn) => [...priorLessons].reverse().find(fn) ?? null;

  if (step.mode === QUIZ_MODES.RECOGNISE) {
    const bank = QUESTION_BANKS[languageId] ?? [];
    if (bank.length) {
      const start = (moduleIndex * 2) % Math.max(1, bank.length - 2);
      return {
        mode: QUIZ_MODES.RECOGNISE,
        basis: step.basis,
        questions: bank.slice(start, start + 3),
      };
    }
  }

  /* ---- written answer about the video that preceded it -------------------- */
  if (step.mode === QUIZ_MODES.WRITE && step.basis === TASK_BASIS.VIDEO) {
    const video = lastWhere((l) => l.type === LESSON_TYPES.VIDEO);
    return {
      mode: QUIZ_MODES.WRITE,
      basis: TASK_BASIS.VIDEO,
      prompt: {
        ...writingPromptFor(languageId),
        id: video ? `${video.id}-write` : `${title}-write`,
        title,
        question: `What did this lesson teach you about ${title.toLowerCase()}?`,
        instruction: `Answer in ${languageName}, in two or three sentences. Use the phrases from the video rather than describing them in English.`,
      },
      source: video
        ? {
            kind: TASK_BASIS.VIDEO,
            lessonId: video.id,
            title: video.title,
            transcript: video.video?.transcript ?? null,
          }
        : null,
    };
  }

  /* ---- written answer about the conversation they just heard -------------- */
  if (step.mode === QUIZ_MODES.WRITE && step.basis === TASK_BASIS.CONVERSATION) {
    const audio = lastWhere((l) => l.audio?.conversation);
    const conversation = audio?.audio?.conversation;
    if (conversation) {
      return {
        mode: QUIZ_MODES.WRITE,
        basis: TASK_BASIS.CONVERSATION,
        prompt: {
          id: `${conversation.id}-write`,
          title: conversation.title,
          question: conversation.comprehension.question,
          questionGloss: conversation.comprehension.questionGloss,
          instruction: conversation.comprehension.instruction,
        },
        source: {
          kind: TASK_BASIS.CONVERSATION,
          lessonId: audio.id,
          conversationId: conversation.id,
          title: conversation.title,
          transcript: transcriptOf(conversation),
          // The marking scheme travels with the task, so comprehension is graded against
          // the facts of the dialogue rather than against the model's own memory of it.
          expectedPoints: conversation.expectedPoints,
        },
      };
    }
  }

  /* ---- spoken answer about the passage they just read --------------------- */
  if (step.mode === QUIZ_MODES.SPEAK && step.basis === TASK_BASIS.READING) {
    const read = lastWhere((l) => l.reading?.passage);
    const passage = read?.reading?.passage;
    if (passage) {
      return {
        mode: QUIZ_MODES.SPEAK,
        basis: TASK_BASIS.READING,
        prompt: {
          id: `${passage.id}-speak`,
          title: passage.title,
          instruction: passage.speaking.instruction,
          guidingQuestions: passage.speaking.guidingQuestions,
          // Deliberately NOT a read-aloud. Reading the passage back tests pronunciation;
          // talking about it tests whether the learner can use the language.
          kind: 'discuss',
        },
        source: {
          kind: TASK_BASIS.READING,
          lessonId: read.id,
          passageId: passage.id,
          title: passage.title,
          transcript: passage.body.join(' '),
        },
      };
    }
  }

  /* ---- fallbacks: an open prompt in the learner's own words ---------------- */
  if (step.mode === QUIZ_MODES.SPEAK) {
    return {
      mode: QUIZ_MODES.SPEAK,
      basis: TASK_BASIS.OPEN,
      prompt: speakingPromptsFor(languageId)[r.int(0, 1)],
      source: null,
    };
  }

  return {
    mode: QUIZ_MODES.WRITE,
    basis: TASK_BASIS.OPEN,
    prompt: {
      ...writingPromptFor(languageId),
      title,
      instruction: `Write two or three sentences in ${languageName} using what this module covered.`,
    },
    source: null,
  };
}

function contentFor({
  step,
  type,
  title,
  languageId,
  languageName,
  moduleIndex,
  lessonIndex,
  priorLessons,
  r,
}) {
  const vocab = vocabularyFor(languageId);

  if (type === LESSON_TYPES.VIDEO) {
    return {
      video: {
        // No real footage exists yet; the player renders a branded stand-in and says so.
        source: null,
        transcript: `In this lesson your teacher works through ${title.toLowerCase()} in ${languageName}, with the phrases repeated slowly and then at natural speed.`,
      },
    };
  }

  if (type === LESSON_TYPES.AUDIO) {
    // A two-speaker conversation where one exists. Listening to people talk to each other
    // is a different skill from repeating isolated phrases, and it is the one a learner
    // needs before they can hold a conversation of their own.
    const conversation =
      step.basis === TASK_BASIS.CONVERSATION
        ? conversationFor(languageId, moduleIndex + lessonIndex)
        : null;

    if (conversation) {
      return {
        audio: {
          source: null,
          conversation,
          instruction:
            'Listen to the whole conversation before you open the transcript. You will be asked what was said.',
        },
      };
    }

    return {
      audio: {
        source: null,
        instruction: 'Listen, then say each line back before moving on.',
        phrases: r.sample(vocab, Math.min(4, vocab.length)),
      },
    };
  }

  if (type === LESSON_TYPES.READING) {
    const passage = step.basis === TASK_BASIS.READING ? passageFor(languageId, moduleIndex) : null;

    if (passage) {
      return {
        reading: {
          passage,
          body: passage.body,
          gloss: passage.gloss,
          glossary: passage.glossary,
          instruction:
            'Read it twice: once for meaning, once out loud. You will be asked to talk about it.',
        },
      };
    }

    return {
      reading: {
        body: [
          `${title} is one of the first things a ${languageName} speaker will notice about your speech.`,
          'Read the passage twice. The first time for meaning, the second time out loud - reading aloud is what moves a phrase from recognised to usable.',
        ],
        glossary: r.sample(vocab, Math.min(5, vocab.length)),
      },
    };
  }

  if (type === LESSON_TYPES.QUIZ) {
    return {
      quiz: quizFor({ step, languageId, languageName, title, moduleIndex, priorLessons, r }),
    };
  }

  return {
    game: {
      kind: 'match',
      instruction: 'Match each word to its meaning. Wrong pairs cost you nothing but time.',
      pairs: r.sample(vocab, Math.min(6, vocab.length)),
    },
  };
}

/** Steps the learner receives rather than produces. A module must never end on one. */
const INPUT_TYPES = new Set([LESSON_TYPES.VIDEO, LESSON_TYPES.AUDIO, LESSON_TYPES.READING]);

/**
 * Expand a course's bare module list into playable lessons.
 *
 * The arc cursor runs across the WHOLE course rather than resetting each module. Modules
 * hold three or four lessons and the arc is seven steps, so restarting per module would
 * mean every module was video-then-writing and a learner would never reach the reading
 * and speaking half of the trajectory. Carrying the cursor forward means the course as a
 * whole walks the full arc, repeatedly.
 *
 * Where a module would otherwise end on an input, its production task is appended. That
 * is the one invariant worth protecting here: a learner never listens to a conversation
 * or reads a passage without then being asked to do something with it.
 *
 * Deterministic per course, so a learner's syllabus never reshuffles under them.
 */
export function buildCurriculum(course) {
  const language = getLanguage(course.languageId);
  const languageName = language?.name ?? course.languageName;
  const arc = arcFor(course.languageId);

  let cursor = 0;

  return course.modules.map((module, moduleIndex) => {
    const r = rng(`curriculum:${course.id}:${moduleIndex}`);
    const lessons = [];

    const build = (lesson, lessonIndex) => {
      const step = arc[cursor % arc.length];
      cursor += 1;
      const built = {
        ...lesson,
        moduleId: module.id,
        type: step.type,
        basis: step.basis,
        ...contentFor({
          step,
          type: step.type,
          title: lesson.title,
          languageId: course.languageId,
          languageName,
          moduleIndex,
          lessonIndex,
          priorLessons: lessons,
          r,
        }),
      };
      lessons.push(built);
      return built;
    };

    module.lessons.forEach(build);

    // Close the loop: an input with no task after it is the failure mode this guards.
    while (INPUT_TYPES.has(lessons[lessons.length - 1]?.type)) {
      const source = lessons[lessons.length - 1];
      build(
        {
          id: `${source.id}-task`,
          title: `${source.title} — over to you`,
          minutes: 5,
        },
        lessons.length,
      );
    }

    return {
      ...module,
      lessons,
      // Assessment is continuous: each module can end in a checkpoint that reports
      // into the learner's level, so they are re-placed as they go rather than once.
      checkpoint:
        moduleIndex > 0 || course.modules.length === 1
          ? {
              id: `${module.id}-checkpoint`,
              title: `${module.title} checkpoint`,
              level: course.level,
              questions: (QUESTION_BANKS[course.languageId] ?? []).slice(
                moduleIndex,
                moduleIndex + 3,
              ),
            }
          : null,
    };
  });
}

/** Flat lesson list in play order, which is what "next" and progress need. */
export function flattenCurriculum(modules) {
  return modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
    })),
  );
}
