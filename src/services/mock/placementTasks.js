import { getLanguage } from '@/services/mock/catalog';

/**
 * The speaking and writing halves of the placement test.
 *
 * Kept apart from the multiple-choice banks in placement.js because they are a different
 * kind of content: open tasks a human reads or listens to, rather than items with a right
 * answer. See lib/placementScoring.js for exactly what each can and cannot be scored on.
 */

/**
 * Two speaking prompts per language.
 *
 * The first is read-aloud, against a line we already know, so a teacher can compare the
 * recording with the target. The second is open, because being able to produce anything
 * unscripted is the difference between recognising a language and speaking it.
 */
const speakingPrompts = (language) => [
  {
    id: 'speak-read',
    kind: 'read-aloud',
    title: 'Read this out loud',
    instruction: `Say this line in ${language.name}. If you cannot read it yet, say it however you can — that tells us something too.`,
    text: language.greeting,
    maxSeconds: 30,
  },
  {
    id: 'speak-free',
    kind: 'open',
    title: 'Say a little about yourself',
    instruction: `Introduce yourself in ${language.name} — your name, where you are from, why you are learning. Use an English word for anything you do not know yet.`,
    maxSeconds: 60,
  },
];

/**
 * Writing prompts. `expectedWords` are what a competent answer usually contains; overlap
 * with them is one of the few automatic signals available without a language model.
 */
const WRITING_PROMPTS = {
  yoruba: {
    placeholder: 'Orúkọ mi ni…',
    expectedWords: ['orúkọ', 'oruko', 'mi', 'ni', 'mo', 'gbé', 'gbe'],
  },
  igbo: {
    placeholder: 'Aha m bụ…',
    expectedWords: ['aha', 'bụ', 'bu', 'm', 'si', 'bi'],
  },
  hausa: {
    placeholder: 'Sunana…',
    expectedWords: ['sunana', 'ina', 'zaune', 'daga', 'ne'],
  },
  swahili: {
    placeholder: 'Jina langu ni…',
    expectedWords: ['jina', 'langu', 'ni', 'ninaishi', 'natoka'],
  },
  zulu: {
    placeholder: 'Igama lami ngu…',
    expectedWords: ['igama', 'lami', 'ngu', 'ngihlala', 'ngivela'],
  },
  twi: {
    placeholder: 'Me din de…',
    expectedWords: ['me', 'din', 'de', 'mete', 'firi'],
  },
  wolof: {
    placeholder: 'Maa ngi tudd…',
    expectedWords: ['maa', 'ngi', 'tudd', 'naa'],
  },
  amharic: {
    placeholder: 'ስሜ … ነው',
    expectedWords: ['ስሜ', 'ነው'],
  },
};

export const speakingPromptsFor = (languageId) => {
  const language = getLanguage(languageId);
  return language ? speakingPrompts(language) : [];
};

export function writingPromptFor(languageId) {
  const language = getLanguage(languageId);
  if (!language) return null;

  const authored = WRITING_PROMPTS[languageId];
  return {
    id: 'write-intro',
    title: 'Introduce yourself in writing',
    instruction: `Write two or three sentences in ${language.name}. Include your name and where you live. Write what you can — a single line still tells us something.`,
    placeholder: authored?.placeholder ?? `Write in ${language.name}…`,
    expectedWords: authored?.expectedWords ?? [],
    script: language.script,
    tonal: language.tonal,
  };
}
