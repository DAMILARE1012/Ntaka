import { rng } from '@/lib/prng';
import { levelRange } from '@/lib/cefr';
import { timezoneForCountry } from '@/lib/timezone';
import { buildRules } from '@/services/mock/scheduling';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { GIVEN_NAMES, FAMILY_NAMES, BRIDGE_LANGUAGES } from '@/services/mock/names';

export const TEACHER_TAGS = [
  'Conversation',
  'Beginner friendly',
  'Heritage learners',
  'Business',
  'Kids',
  'Culture & proverbs',
  'Pronunciation & tone',
  'Grammar drills',
  'Exam prep',
  'Writing & script',
];

const HEADLINE_TEMPLATES = [
  'Native {lang} teacher · patient, structured lessons for every level',
  'Speak {lang} from lesson one — conversation-first coaching',
  'Certified {lang} tutor helping diaspora learners reconnect',
  '{lang} for professionals: meetings, email and negotiation',
  'Fun, story-driven {lang} lessons for kids and teens',
  'Tone and pronunciation specialist — sound natural in {lang}',
  'University-trained {lang} linguist · grammar made simple',
  'Learn {lang} through proverbs, music and everyday culture',
];

const BIO_OPENERS = [
  'I have been teaching {lang} online for {years} years to learners in more than 20 countries.',
  'I am a {country}-based teacher with {years} years of classroom and online experience in {lang}.',
  'After {years} years teaching {lang} at secondary and university level, I moved my classroom online.',
  'I grew up speaking {lang} at home and have spent {years} years helping others do the same.',
];

const BIO_METHOD = [
  'Every lesson starts with ten minutes of speaking, then targeted correction, then a short task you take away.',
  'I build a personal plan around your goal — family, travel, work or exams — and we review it every six lessons.',
  'I use real material: radio clips, market dialogue, music and news, graded to your level.',
  'My lessons are structured around the CEFR can-do statements, so you always know exactly what you can do next.',
];

const BIO_CLOSER = [
  'Book a trial and tell me what you want to be able to say in three months.',
  'Complete beginners are very welcome — we start with sounds and greetings.',
  'If you are reconnecting with heritage, I will pace things gently and explain the culture behind the words.',
  'I record every new phrase so you can review between lessons.',
];

const AVAILABILITY_SHAPES = ['morning', 'evening', 'mixed', 'overnight'];

/** Number of teachers per language — featured languages get a deeper bench. */
const benchSize = (language) => (language.featured ? 6 : 3);

function buildTeacher(language, index) {
  const r = rng(`teacher:${language.id}:${index}`);
  const given = GIVEN_NAMES[language.id] ?? ['Ama', 'Kofi', 'Zola'];
  const family = FAMILY_NAMES[language.countryId] ?? ['Okafor'];

  const givenName = given[index % given.length];
  const useFamilyName = r.chance(0.55);
  const name = useFamilyName ? `${givenName} ${r.pick(family)}` : givenName;

  const isProfessional = r.chance(0.62);
  const years = r.int(2, 16);
  const lessons = isProfessional ? r.int(320, 7400) : r.int(40, 1800);
  const isNew = lessons < 60;
  const reviews = Math.round(lessons * r.float(0.18, 0.42));
  const rating = isNew ? null : r.float(4.5, 5.0, 1);

  const hourly = isProfessional ? r.int(14, 42) : r.int(6, 18);
  const trial = Math.max(3, Math.round(hourly * r.float(0.3, 0.55)));

  // Availability is stored as weekly rules in the teacher's own timezone. The grid shown
  // on cards and profiles is derived from these at read time, so what a learner sees and
  // what they can actually book are the same thing by construction.
  const shape = AVAILABILITY_SHAPES[index % AVAILABILITY_SHAPES.length];
  const timezone = timezoneForCountry(language.countryId);
  const availabilityRules = buildRules(`${language.id}-${index + 1}`, shape);

  // Bridge languages a learner might share with the teacher.
  const bridges = r.sample(
    BRIDGE_LANGUAGES.filter((b) => b !== language.name),
    r.int(1, 3),
  );

  const topLevel = r.chance(0.7) ? 'C2' : 'C1';

  return {
    id: `${language.id}-${index + 1}`,
    slug: `${language.id}-${index + 1}`,
    name,
    languageId: language.id,
    languageName: language.name,
    countryId: language.countryId,
    country: language.country,
    flag: language.flag,
    iso: language.iso,
    type: isProfessional ? 'professional' : 'community',
    typeLabel: isProfessional ? 'Professional Teacher' : 'Community Tutor',
    verified: isProfessional || r.chance(0.4),
    hasVideoIntro: r.chance(0.75),
    instantLesson: r.chance(0.28),
    isNew,
    years,
    headline: r.pick(HEADLINE_TEMPLATES).replace('{lang}', language.name),
    bio: [
      r
        .pick(BIO_OPENERS)
        .replace('{lang}', language.name)
        .replace('{years}', String(years))
        .replace('{country}', language.country),
      r.pick(BIO_METHOD),
      r.pick(BIO_CLOSER),
    ].join(' '),
    // Teaching + spoken languages, proficiency on a 1–6 scale (6 = native).
    speaks: [
      { name: language.name, proficiency: 6, label: 'Native' },
      ...bridges.map((b) => {
        const p = r.int(3, 6);
        return { name: b, proficiency: p, label: p === 6 ? 'Native' : `C${Math.max(1, p - 3)}` };
      }),
    ],
    tags: r.sample(TEACHER_TAGS, r.int(2, 4)),
    levels: levelRange('A1', topLevel),
    rating,
    reviews,
    lessons,
    students: Math.round(lessons / r.float(4, 12)),
    hourlyRate: hourly,
    trialPrice: trial,
    currency: 'USD',
    responseTime: `${r.int(1, 12)} hrs`,
    attendanceRate: r.int(94, 100),
    timezone,
    availabilityShape: shape,
    availabilityRules,
    packages: [
      { lessons: 5, discount: 0.05 },
      { lessons: 10, discount: 0.1 },
      { lessons: 20, discount: 0.15 },
    ],
  };
}

export const TEACHERS = LANGUAGES_FULL.flatMap((language) =>
  Array.from({ length: benchSize(language) }, (_, i) => buildTeacher(language, i)),
);

export const TEACHERS_BY_ID = Object.fromEntries(TEACHERS.map((t) => [t.id, t]));

export const teacherCountFor = (languageId) =>
  TEACHERS.filter((t) => t.languageId === languageId).length;
