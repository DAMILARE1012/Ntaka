import { rng } from '@/lib/prng';
import { getLanguage } from '@/services/mock/catalog';
import { QUESTION_BANKS } from '@/services/mock/placement';
import { writingPromptFor, speakingPromptsFor } from '@/services/mock/placementTasks';

/**
 * Lesson content for Interactive Learning.
 *
 * A course is modules of lessons, and a lesson is one of five kinds. The kinds matter
 * more than the count: a learner who only watches never produces language, so every
 * module ends in something they have to *do*.
 *
 *   video     watch, with a transcript
 *   audio     listen and shadow - the phrases are the point, not the recording
 *   reading   a short passage plus its vocabulary
 *   quiz      recognise (multiple choice), write, or speak - the last two go to the LLM
 *   game      recall under mild pressure, which is what fixes vocabulary
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

/** Which kind a lesson takes, from its position. Every module ends in production. */
function lessonTypeFor(index, total, r) {
  if (index === total - 1) return r.chance(0.5) ? LESSON_TYPES.QUIZ : LESSON_TYPES.GAME;
  if (index === 0) return LESSON_TYPES.VIDEO;
  return r.pick([LESSON_TYPES.AUDIO, LESSON_TYPES.READING, LESSON_TYPES.VIDEO, LESSON_TYPES.QUIZ]);
}

function quizFor({ languageId, languageName, title, moduleIndex, r }) {
  const bank = QUESTION_BANKS[languageId] ?? [];
  const mode = r.pick([
    QUIZ_MODES.RECOGNISE,
    QUIZ_MODES.RECOGNISE,
    QUIZ_MODES.WRITE,
    QUIZ_MODES.SPEAK,
  ]);

  if (mode === QUIZ_MODES.RECOGNISE && bank.length) {
    // Draw from the placement bank rather than inventing questions of unknown quality.
    const start = (moduleIndex * 2) % Math.max(1, bank.length - 2);
    return { mode, questions: bank.slice(start, start + 3) };
  }

  if (mode === QUIZ_MODES.WRITE || !bank.length) {
    const base = writingPromptFor(languageId);
    return {
      mode: QUIZ_MODES.WRITE,
      prompt: {
        ...base,
        title,
        instruction: `Write two or three sentences in ${languageName} using what this module covered.`,
      },
    };
  }

  return { mode: QUIZ_MODES.SPEAK, prompt: speakingPromptsFor(languageId)[r.int(0, 1)] };
}

function contentFor({ type, title, languageId, languageName, moduleIndex, r }) {
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
    return {
      audio: {
        source: null,
        instruction: 'Listen, then say each line back before moving on.',
        phrases: r.sample(vocab, Math.min(4, vocab.length)),
      },
    };
  }

  if (type === LESSON_TYPES.READING) {
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
    return { quiz: quizFor({ languageId, languageName, title, moduleIndex, r }) };
  }

  return {
    game: {
      kind: 'match',
      instruction: 'Match each word to its meaning. Wrong pairs cost you nothing but time.',
      pairs: r.sample(vocab, Math.min(6, vocab.length)),
    },
  };
}

/**
 * Expand a course's bare module list into playable lessons.
 * Deterministic per course, so a learner's syllabus never reshuffles under them.
 */
export function buildCurriculum(course) {
  const language = getLanguage(course.languageId);
  const languageName = language?.name ?? course.languageName;

  return course.modules.map((module, moduleIndex) => {
    const r = rng(`curriculum:${course.id}:${moduleIndex}`);

    const lessons = module.lessons.map((lesson, index) => {
      const type = lessonTypeFor(index, module.lessons.length, r);
      return {
        ...lesson,
        moduleId: module.id,
        type,
        ...contentFor({
          type,
          title: lesson.title,
          languageId: course.languageId,
          languageName,
          moduleIndex,
          r,
        }),
      };
    });

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
