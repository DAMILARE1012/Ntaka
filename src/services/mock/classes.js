import { rng } from '@/lib/prng';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { TEACHERS } from '@/services/mock/teachers';

export const CLASS_TOPICS = [
  { key: 'conversation', label: 'Conversation club', levels: ['A2', 'B1', 'B2'] },
  { key: 'foundations', label: 'Absolute beginner foundations', levels: ['A1'] },
  { key: 'pronunciation', label: 'Tone & pronunciation lab', levels: ['A1', 'A2', 'B1'] },
  { key: 'culture', label: 'Proverbs & culture circle', levels: ['B1', 'B2', 'C1'] },
  { key: 'business', label: 'Business & workplace', levels: ['B1', 'B2'] },
  { key: 'kids', label: 'Kids & teens', levels: ['A1', 'A2'] },
  { key: 'heritage', label: 'Heritage speakers workshop', levels: ['A2', 'B1'] },
  { key: 'script', label: 'Reading & writing the script', levels: ['A1', 'A2', 'B1'] },
  { key: 'music', label: 'Learn through music', levels: ['A2', 'B1'] },
];

const TITLE_BY_TOPIC = {
  conversation: '{lang} Conversation Club',
  foundations: 'First Words: {lang} Foundations',
  pronunciation: '{lang} Tone & Pronunciation Lab',
  culture: 'Proverbs & Culture Circle in {lang}',
  business: 'Business {lang} for the Workplace',
  kids: '{lang} for Kids & Teens',
  heritage: 'Heritage Speakers: Rebuild Your {lang}',
  script: 'Reading & Writing {lang}',
  music: 'Learn {lang} Through Music',
};

const DESCRIPTION_BY_TOPIC = {
  conversation:
    'A small, warm group where everyone speaks. The teacher sets a theme, seeds the vocabulary, then steps back and coaches.',
  foundations:
    'Start from zero: greetings, sounds, numbers and the phrases that get you through a first conversation.',
  pronunciation:
    'Focused drilling on the sounds and tones that make learners hard to understand, with live correction and recordings.',
  culture:
    'One proverb, one story, one discussion each session. Built for learners who want depth as well as fluency.',
  business:
    'Meetings, introductions, negotiation and written follow-up. Role-plays drawn from real workplace situations.',
  kids: 'Songs, games and stories. Short, high-energy sessions designed to hold young attention.',
  heritage:
    'For learners who understand more than they can say. We unlock passive knowledge and rebuild confidence to speak.',
  script:
    'Learn to read and write comfortably, character by character, with handwriting practice and graded reading.',
  music:
    'Work through lyrics line by line — vocabulary, grammar and the cultural references behind the songs.',
};

const HOURS_OF_DAY = [7, 9, 12, 15, 17, 18, 19, 20];

function buildClass(language, teacher, index) {
  const r = rng(`class:${language.id}:${teacher.id}:${index}`);
  const topic = r.pick(CLASS_TOPICS);
  const level = r.pick(topic.levels);

  const start = new Date();
  start.setDate(start.getDate() + r.int(1, 21));
  start.setHours(r.pick(HOURS_OF_DAY), r.pick([0, 0, 30]), 0, 0);

  const seatsTotal = r.pick([4, 5, 6, 6, 8, 10]);
  const seatsTaken = r.int(0, seatsTotal - 1);
  const sessionCount = r.pick([1, 1, 4, 6, 8]);

  return {
    id: `class-${language.id}-${teacher.id}-${index}`,
    title: TITLE_BY_TOPIC[topic.key].replace('{lang}', language.name),
    topic: topic.key,
    topicLabel: topic.label,
    languageId: language.id,
    languageName: language.name,
    flag: language.flag,
    iso: language.iso,
    teacherId: teacher.id,
    level,
    description: DESCRIPTION_BY_TOPIC[topic.key],
    startsAt: start.toISOString(),
    durationMins: r.pick([45, 55, 60, 60, 90]),
    sessionCount,
    recurrence: sessionCount === 1 ? 'One-off session' : `${sessionCount}-week series · weekly`,
    seatsTotal,
    seatsTaken,
    seatsLeft: seatsTotal - seatsTaken,
    pricePerSeat: r.int(4, 16),
    currency: 'USD',
    rating: teacher.rating,
    reviews: Math.round((teacher.reviews ?? 0) * r.float(0.05, 0.2)),
    isTrialFriendly: r.chance(0.4),
  };
}

export const GROUP_CLASSES = LANGUAGES_FULL.flatMap((language) => {
  const bench = TEACHERS.filter((t) => t.languageId === language.id);
  const perTeacher = language.featured ? 2 : 1;
  return bench.flatMap((teacher, ti) =>
    Array.from({ length: perTeacher }, (_, i) => buildClass(language, teacher, ti * 10 + i)),
  );
}).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

export const CLASSES_BY_ID = Object.fromEntries(GROUP_CLASSES.map((c) => [c.id, c]));
