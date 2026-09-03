import { rng } from '@/lib/prng';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { TEACHERS } from '@/services/mock/teachers';

/**
 * Video Learning = self-paced, on-demand video courses.
 * (Industry term: "self-paced video course" / "on-demand course". Ntaka surfaces it as
 * "Video Learning" in navigation and "self-paced course" in body copy.)
 */

export const VIDEO_TRACKS = [
  {
    key: 'starter',
    label: 'Starter track',
    level: 'A1',
    titleTemplate: '{lang} from Scratch: Your First 100 Phrases',
    promise: 'Go from no words at all to holding a two-minute introduction.',
    modules: [
      { title: 'Sounds and greetings', lessons: ['The alphabet and sounds', 'Greetings by time of day', 'Polite forms and respect'] },
      { title: 'People and family', lessons: ['Introducing yourself', 'Family words', 'Numbers 1–20', 'Asking simple questions'] },
      { title: 'Getting around', lessons: ['In the market', 'Money and bargaining', 'Directions', 'Your first conversation'] },
    ],
  },
  {
    key: 'everyday',
    label: 'Everyday track',
    level: 'A2',
    titleTemplate: 'Everyday {lang}: Markets, Family and Small Talk',
    promise: 'Handle the ordinary day — shopping, transport, greetings, plans — without switching to English.',
    modules: [
      { title: 'Daily routine', lessons: ['Telling the time', 'Talking about your day', 'Days and months'] },
      { title: 'Food and market', lessons: ['Ordering food', 'Bargaining like a local', 'Ingredients and cooking'] },
      { title: 'Social life', lessons: ['Making plans', 'Compliments and small talk', 'On the phone', 'Apologising politely'] },
    ],
  },
  {
    key: 'grammar',
    label: 'Grammar track',
    level: 'B1',
    titleTemplate: '{lang} Grammar Made Clear',
    promise: 'Understand the system behind the sentences so you can build your own.',
    modules: [
      { title: 'The verb system', lessons: ['Tense and aspect', 'Negation', 'Serial verbs'] },
      { title: 'Nouns and agreement', lessons: ['Noun classes', 'Possession', 'Plurals and quantifiers'] },
      { title: 'Building sentences', lessons: ['Questions', 'Relative clauses', 'Conditionals', 'Reported speech'] },
    ],
  },
  {
    key: 'culture',
    label: 'Culture track',
    level: 'B2',
    titleTemplate: 'Proverbs, Praise and Story in {lang}',
    promise: 'Move past correct into idiomatic — the proverbs, praise names and register native speakers actually use.',
    modules: [
      { title: 'Proverbs', lessons: ['Reading a proverb', 'Proverbs about work', 'Proverbs about family'] },
      { title: 'Oral tradition', lessons: ['Praise poetry', 'Folktales and the trickster', 'Riddles'] },
      { title: 'Register', lessons: ['Speaking to elders', 'Formal vs street speech', 'Humour and teasing'] },
    ],
  },
  {
    key: 'professional',
    label: 'Professional track',
    level: 'B2',
    titleTemplate: 'Professional {lang} for Work',
    promise: 'Present, negotiate and write with confidence in a professional setting.',
    modules: [
      { title: 'Meetings', lessons: ['Opening a meeting', 'Agreeing and disagreeing', 'Summarising'] },
      { title: 'Written work', lessons: ['Email conventions', 'Reports', 'Messaging clients'] },
      { title: 'Negotiation', lessons: ['Making a proposal', 'Handling pushback', 'Closing a deal'] },
    ],
  },
  {
    key: 'script',
    label: 'Script track',
    level: 'A1',
    titleTemplate: 'Read and Write {lang}',
    promise: 'Read confidently and write by hand, one character group at a time.',
    modules: [
      { title: 'The system', lessons: ['How the script works', 'First character set', 'Second character set'] },
      { title: 'Practice', lessons: ['Handwriting drills', 'Reading signs', 'Reading a short text'] },
    ],
  },
];

function buildCourse(language, teacher, track, index) {
  const r = rng(`video:${language.id}:${track.key}:${index}`);

  const modules = track.modules.map((mod, mi) => ({
    id: `m${mi + 1}`,
    title: mod.title,
    lessons: mod.lessons.map((title, li) => ({
      id: `m${mi + 1}l${li + 1}`,
      title,
      minutes: r.int(4, 18),
      isPreview: mi === 0 && li === 0,
    })),
  }));

  const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalMinutes = modules.reduce(
    (n, m) => n + m.lessons.reduce((s, l) => s + l.minutes, 0),
    0,
  );
  const isFree = r.chance(0.22);

  return {
    id: `video-${language.id}-${track.key}`,
    title: track.titleTemplate.replace('{lang}', language.name),
    trackKey: track.key,
    trackLabel: track.label,
    languageId: language.id,
    languageName: language.name,
    flag: language.flag,
    iso: language.iso,
    teacherId: teacher.id,
    level: track.level,
    promise: track.promise,
    description: `${track.promise} Filmed with ${teacher.name}, a ${teacher.typeLabel.toLowerCase()} from ${language.country}. Watch at your own pace, repeat any lesson, and bring your questions to a 1-on-1 or group session when you are ready.`,
    modules,
    lessonCount,
    totalMinutes,
    price: isFree ? 0 : r.int(9, 49),
    isFree,
    currency: 'USD',
    rating: r.float(4.3, 5.0, 1),
    reviews: r.int(24, 940),
    enrolled: r.int(180, 12400),
    updatedAt: `${r.pick(['January', 'March', 'May', 'July', 'September'])} ${r.pick([2024, 2025])}`,
    includes: [
      `${lessonCount} on-demand video lessons`,
      'Downloadable phrase sheets and audio',
      'Quizzes after every module',
      'Lifetime access, learn at your own pace',
      'Certificate of completion',
    ],
  };
}

export const VIDEO_COURSES = LANGUAGES_FULL.flatMap((language) => {
  const bench = TEACHERS.filter((t) => t.languageId === language.id);
  if (!bench.length) return [];
  const r = rng(`videoset:${language.id}`);
  const tracks = language.featured ? VIDEO_TRACKS : r.sample(VIDEO_TRACKS, 3);
  return tracks.map((track, i) => buildCourse(language, bench[i % bench.length], track, i));
});

export const VIDEOS_BY_ID = Object.fromEntries(VIDEO_COURSES.map((v) => [v.id, v]));
