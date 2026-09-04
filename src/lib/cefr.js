/**
 * The six CEFR levels Ntaka teaches against.
 * Teachers, group classes, interactive courses and placement results all speak this vocabulary.
 */
export const CEFR_LEVELS = [
  {
    code: 'A1',
    name: 'Beginner',
    band: 'Basic user',
    tagline: 'Your first words and greetings',
    summary:
      'You can greet people, introduce yourself and handle very simple, predictable exchanges using set phrases.',
    canDo: [
      'Greet people and introduce yourself',
      'Use numbers, days and simple questions',
      'Understand slow, clear speech about familiar things',
    ],
    hours: '0 – 80 hours',
    accent: 'palm',
  },
  {
    code: 'A2',
    name: 'Elementary',
    band: 'Basic user',
    tagline: 'Everyday survival conversations',
    summary:
      'You can handle markets, transport, family talk and short social exchanges on familiar topics.',
    canDo: [
      'Shop, order food and ask for directions',
      'Describe your family, work and routine',
      'Write short notes and simple messages',
    ],
    hours: '80 – 180 hours',
    accent: 'palm',
  },
  {
    code: 'B1',
    name: 'Intermediate',
    band: 'Independent user',
    tagline: 'Hold your own in real conversation',
    summary:
      'You can deal with most situations while travelling, explain opinions and follow everyday speech.',
    canDo: [
      'Explain your opinions and plans',
      'Follow a conversation between native speakers',
      'Tell a story or describe an experience',
    ],
    hours: '180 – 350 hours',
    accent: 'savanna',
  },
  {
    code: 'B2',
    name: 'Upper intermediate',
    band: 'Independent user',
    tagline: 'Comfortable, fluent, natural',
    summary:
      'You can argue a point, understand fast speech and use the language at work without much strain.',
    canDo: [
      'Take part in debates and meetings',
      'Understand radio, film and idiom',
      'Write clear, detailed text on many subjects',
    ],
    hours: '350 – 550 hours',
    accent: 'savanna',
  },
  {
    code: 'C1',
    name: 'Advanced',
    band: 'Proficient user',
    tagline: 'Fluent, precise, culturally aware',
    summary:
      'You use the language flexibly for social, academic and professional purposes, including proverbs and register.',
    canDo: [
      'Use proverbs, idiom and register correctly',
      'Present and negotiate professionally',
      'Understand implicit meaning and humour',
    ],
    hours: '550 – 800 hours',
    accent: 'clay',
  },
  {
    code: 'C2',
    name: 'Mastery',
    band: 'Proficient user',
    tagline: 'Near-native command',
    summary:
      'You understand virtually everything you hear or read and express yourself with precision, including in oral literature.',
    canDo: [
      'Follow oral poetry, praise names and proverbs',
      'Summarise and reconstruct arguments coherently',
      'Shift register and dialect at will',
    ],
    hours: '800+ hours',
    accent: 'clay',
  },
];

export const LEVEL_CODES = CEFR_LEVELS.map((l) => l.code);

export const getLevel = (code) => CEFR_LEVELS.find((l) => l.code === code) ?? CEFR_LEVELS[0];

export const levelIndex = (code) => LEVEL_CODES.indexOf(code);

/** Expand shorthand like ('A1', 'B2') into an inclusive range of level codes. */
export const levelRange = (from, to) => LEVEL_CODES.slice(levelIndex(from), levelIndex(to) + 1);

/** Tailwind classes per level, used by LevelBadge and the placement result screen. */
/**
 * Level chips read as one family: the greens deepen as the level rises, so a learner
 * can rank two badges at a glance without reading them.
 */
export const LEVEL_STYLES = {
  A1: 'bg-leaf-50 text-leaf-700 ring-leaf-200 dark:bg-leaf-950 dark:text-leaf-300 dark:ring-leaf-800',
  A2: 'bg-leaf-100 text-leaf-800 ring-leaf-300 dark:bg-leaf-950 dark:text-leaf-300 dark:ring-leaf-800',
  B1: 'bg-leaf-200/70 text-leaf-800 ring-leaf-300 dark:bg-leaf-900/60 dark:text-leaf-200 dark:ring-leaf-700',
  B2: 'bg-leaf-300/60 text-leaf-900 ring-leaf-400 dark:bg-leaf-800/60 dark:text-leaf-100 dark:ring-leaf-600',
  C1: 'bg-leaf-600 text-white ring-leaf-700 dark:bg-leaf-700 dark:text-white dark:ring-leaf-600',
  C2: 'bg-leaf-800 text-white ring-leaf-900 dark:bg-leaf-600 dark:text-white dark:ring-leaf-500',
};
