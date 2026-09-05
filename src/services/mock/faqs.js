/**
 * Frequently asked questions.
 *
 * Every answer here is checked against the implementation, not written from wishes — the
 * join window, the lead time, the trial price, the level cap on machine-marked writing and
 * the list of languages Whisper can transcribe all come from real constants. When one of
 * those changes, this file changes with it. `scripts/faq-check.jsx` fails loudly if the
 * numbers drift apart, because a wrong FAQ answer is worse than a missing one: it is the
 * page people read *instead of* asking support.
 *
 * Answers are plain strings rather than JSX so they can go into FAQPage structured data
 * verbatim. Google will not render markup inside an answer, and a mismatch between the
 * visible answer and the marked-up one is a manual-action risk.
 */
export const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting started', icon: 'compass' },
  { id: 'placement', label: 'The placement test', icon: 'target' },
  { id: 'lessons', label: 'Lessons & classes', icon: 'video' },
  { id: 'languages', label: 'Languages & levels', icon: 'globe' },
  { id: 'payments', label: 'Payments', icon: 'badgeCheck' },
  { id: 'privacy', label: 'Privacy & data', icon: 'shield' },
  { id: 'teaching', label: 'Teaching on Ntaka', icon: 'users' },
];

export const FAQS = [
  /* ---------------------------------------------------------- getting started */
  {
    id: 'what-is-ntaka',
    category: 'getting-started',
    question: 'What is Ntaka?',
    answer:
      'Ntaka is a place to learn African languages properly online. You can book 1-on-1 lessons with a native speaker, join a small live group class, or work through interactive courses at your own pace. Everything is graded to the CEFR levels, A1 through C2, so your progress means the same thing here as it does anywhere else.',
  },
  {
    id: 'how-do-i-start',
    category: 'getting-started',
    question: 'How do I get started?',
    answer:
      'Create an account, pick the language you want to learn, and take the free placement test. It takes about six minutes and tells you your CEFR level, what to study next, and which teachers suit you. From there you choose how you want to learn.',
  },
  {
    id: 'need-account',
    category: 'getting-started',
    question: 'Do I need an account to look around?',
    answer:
      'No. You can browse every teacher, class and course, and see prices, ratings and live availability without signing up. You only need an account when you want to take the placement test or book something.',
  },
  {
    id: 'complete-beginner',
    category: 'getting-started',
    question: 'I am a complete beginner. Is that a problem?',
    answer:
      'Not at all — most people who arrive here have never studied the language formally, including people who grew up hearing it. The placement test is built to place true beginners at A1 without making them feel tested, and plenty of teachers work only with beginners.',
  },

  /* ---------------------------------------------------------------- placement */
  {
    id: 'why-placement-required',
    category: 'placement',
    question: 'Why do I have to take the placement test before I can book anything?',
    answer:
      'Because putting someone in the wrong class is the fastest way to make them quit. A B1 speaker in an A1 conversation club is bored, an A1 learner in a B2 class is lost, and neither of them comes back. The test takes six minutes and it is free, and it is what lets us match you to a teacher, a class level and a course that actually fit. It is required once per language, not once per booking.',
  },
  {
    id: 'placement-cost',
    category: 'placement',
    question: 'Does the placement test cost anything?',
    answer:
      'No. It is free, and it stays free. You can also retake it whenever you think you have moved up — every attempt is kept in your test history so you can see your progress over time.',
  },
  {
    id: 'placement-contents',
    category: 'placement',
    question: 'What is in the test?',
    answer:
      'Three parts. Word familiarity, where you pick meanings and spot the odd one out. Writing, where you answer a short prompt in your own words. And speaking, where you record yourself replying to a prompt out loud. A progress bar shows how far through you are, and you can stop and come back.',
  },
  {
    id: 'placement-microphone',
    category: 'placement',
    question: 'Do I have to record my voice?',
    answer:
      'The speaking section asks for it, and it is the part that tells us most about how you actually use the language. You are asked for permission before anything is recorded, and if you decline, the rest of the test still works — you get a level from the reading and writing sections instead.',
  },
  {
    id: 'placement-machine-marked',
    category: 'placement',
    question: 'Is a machine deciding my level?',
    answer:
      'Only partly, and never on its own for the parts that matter. Word familiarity is marked automatically because the answers are unambiguous. Writing is assessed with help from a language model, but it can never place you above B1 by itself — a short written answer simply is not evidence of an advanced level. Speaking is transcribed and summarised, never scored: a teacher reads it. If the automatic marking and a teacher disagree, the teacher wins.',
  },
  {
    id: 'placement-igbo-speaking',
    category: 'placement',
    question: 'Why was my Igbo recording not transcribed?',
    answer:
      'Automatic speech recognition does not cover every African language yet. Yoruba, Hausa, Swahili, Amharic, Somali, Shona and Lingala can be transcribed; Igbo currently cannot. When a language is not covered, your recording goes straight to a teacher instead of a machine, which is slower but more accurate. We would rather tell you that than pretend a machine understood you.',
  },
  {
    id: 'placement-retake',
    category: 'placement',
    question: 'Can I retake the test or change my level?',
    answer:
      'Yes. Retake it any time from your dashboard. Your teacher can also adjust your level after a lesson if they think the test read you wrong — that happens most often with people who speak the language at home but have never read or written it.',
  },

  /* ------------------------------------------------------------------ lessons */
  {
    id: 'three-modes',
    category: 'lessons',
    question: 'What is the difference between the three ways to learn?',
    answer:
      '1-on-1 lessons are private, scheduled or on demand, and move at exactly your pace. Group classes are small live sessions at one CEFR level, which is cheaper and better for practising conversation with peers. Interactive learning is self-paced: video and audio lessons, quizzes that make you read, write and speak back, games, and a certificate at the end. Most people mix them.',
  },
  {
    id: 'where-lessons-happen',
    category: 'lessons',
    question: 'Where do lessons take place?',
    answer:
      'In your browser. There is nothing to install and no meeting link to hunt for — a Join button appears on your lesson in the dashboard. It opens 10 minutes before the start time and stays open until 15 minutes after the lesson ends, so a late start does not lock you out.',
  },
  {
    id: 'booking-notice',
    category: 'lessons',
    question: 'How far in advance do I need to book?',
    answer:
      'At least two hours before the lesson starts, so your teacher has time to see it and prepare. Availability shown on a teacher profile is already in your own time zone — you never have to work out the conversion yourself.',
  },
  {
    id: 'trial-lesson',
    category: 'lessons',
    question: 'Can I try a teacher before committing?',
    answer:
      'Yes. Most teachers offer a short trial lesson from $3, which is the sensible way to find out whether you get on with someone before booking a package. Group class seats start at $4.',
  },
  {
    id: 'missed-lesson',
    category: 'lessons',
    question: 'What if I miss a lesson or need to reschedule?',
    answer:
      'Reschedule from your dashboard and your teacher is notified. Cancellations well ahead of time are free; very late cancellations may still be charged, because your teacher has already set that hour aside. The exact window is shown when you cancel, before you confirm anything.',
  },
  {
    id: 'certificates',
    category: 'lessons',
    question: 'Do I get a certificate?',
    answer:
      'Interactive courses issue a certificate when you finish the course and pass its assessments. It records the language, the CEFR level and the date. Assessments can be taken at any point in a course, not only at the end, so you can prove a level as soon as you have reached it.',
  },

  /* ---------------------------------------------------------------- languages */
  {
    id: 'which-languages',
    category: 'languages',
    question: 'Which languages can I learn?',
    answer:
      '25 African languages across 14 countries, including Yoruba, Igbo and Hausa from Nigeria, Swahili, Amharic, Zulu, Twi, Wolof and Darija. The full list, with the teachers available for each, is on the languages page.',
  },
  {
    id: 'language-missing',
    category: 'languages',
    question: 'My language is not listed. Will you add it?',
    answer:
      'Very likely — tell us which one. We add languages when we can find enough native teachers to make it a real offering rather than a listing, which is why we work with cultural associations and ministries in each country.',
  },
  {
    id: 'cefr-levels',
    category: 'languages',
    question: 'What do A1 to C2 mean?',
    answer:
      'They are the Common European Framework levels, the standard used for language ability worldwide. A1 and A2 are beginner and elementary, B1 and B2 are intermediate, C1 and C2 are advanced. Using them means a level earned on Ntaka is understood by a university or an employer who has never heard of us.',
  },
  {
    id: 'dialects',
    category: 'languages',
    question: 'Which dialect will I be taught?',
    answer:
      'Teachers list the variety they speak on their profile, because it genuinely matters — Yoruba in Ibadan is not Yoruba in Lagos, and Central Igbo differs from what is spoken in Owerri. If you are learning to speak with specific family or colleagues, filter for a teacher from that region.',
  },
  {
    id: 'tones',
    category: 'languages',
    question: 'How do you teach tone?',
    answer:
      'With your voice, not with diagrams. Tone lessons and tone labs are built around recording yourself and comparing it against a native speaker, and speaking quizzes in interactive courses ask you to say the phrase back. Reading about tone marks does not teach anyone to hear them.',
  },

  /* ----------------------------------------------------------------- payments */
  {
    id: 'how-pay',
    category: 'payments',
    question: 'How do I pay?',
    answer:
      'Live teaching is paid as you go: per lesson for 1-on-1, per seat for a group class, with no minimum commitment. Interactive learning is a subscription, monthly or yearly, and you can cancel it any time. Prices are shown in full before you book, with no fee added at checkout.',
  },
  {
    id: 'price-difference',
    category: 'payments',
    question: 'How does pricing work across the three ways to learn?',
    answer:
      'Three different things, so three different prices. A 1-on-1 lesson is paid by the hour at that teacher’s own rate — the dearest, because nobody else is using the time. A group class is paid per person and is always cheaper per hour than that same teacher privately; a smaller class costs a little more per seat than a large one, because you get more of the teacher. Interactive learning is a subscription to the platform rather than a purchase.',
  },
  {
    id: 'subscription',
    category: 'payments',
    question: 'What does the interactive learning subscription include?',
    answer:
      'Every interactive course, in every language we teach — not one course at a time. Start Yorùbá, add Igbo, come back to Swahili, all on the same plan. It covers the video and audio lessons, the quizzes, assessments at any point and certificates when you finish, plus any new course we add while you are subscribed. Monthly or yearly, and the yearly plan is twelve months for the price of ten.',
  },
  {
    id: 'group-class-size-price',
    category: 'payments',
    question: 'Why do some group classes cost more per seat than others?',
    answer:
      'Because of how many seats the class holds. A class capped at four gives you far more of the teacher’s attention than one capped at ten, so it costs more per person. The price is set by the seats offered, not the seats sold — so it never goes up because a class filled, and never changes after you have booked.',
  },
  {
    id: 'subscription-vs-classes',
    category: 'payments',
    question: 'Is the subscription cheaper than paying for group classes?',
    answer:
      'It depends how much you study, and we would rather say so. The subscription is a flat fee however much you use it, so the more you learn the less each hour costs. Against a typical teacher it beats paying per seat once you pass about four hours a month \u2014 roughly an hour a week. Study less than that and booking a group class seat is genuinely the better deal. Most people end up mixing all three.',
  },
  {
    id: 'refunds',
    category: 'payments',
    question: 'What if a lesson does not happen?',
    answer:
      'If a teacher does not show up, or a technical problem on our side stops the lesson, you are refunded in full. Report it from the lesson in your dashboard and it is handled directly.',
  },
  {
    id: 'teacher-payouts',
    category: 'payments',
    question: 'How and when do teachers get paid?',
    answer:
      'Teachers are paid for lessons that took place, on a regular payout cycle. Your earnings and pending balance are visible in the teacher dashboard at all times, so payday is never a surprise.',
  },

  /* ------------------------------------------------------------------ privacy */
  {
    id: 'data-compliance',
    category: 'privacy',
    question: 'How is my data handled?',
    answer:
      "Under Nigeria's NDPA and the EU/UK GDPR. We collect what is needed to run lessons and place you at a level, and nothing beyond it. Your data is never sold, and it is never used to train models.",
  },
  {
    id: 'recordings-kept',
    category: 'privacy',
    question: 'What happens to my placement test recordings?',
    answer:
      'They are used to assess that attempt and are then discarded — they are not kept as a library of your voice. Transcription is done by a named third-party provider, and only after you have explicitly agreed to it. If you decline, nothing is sent anywhere.',
  },
  {
    id: 'lessons-recorded',
    category: 'privacy',
    question: 'Are my lessons recorded?',
    answer:
      'Not by default. A lesson is only ever recorded if both you and your teacher agree to it beforehand, and you will always be able to see when a recording is running.',
  },
  {
    id: 'delete-account',
    category: 'privacy',
    question: 'Can I delete my account and my data?',
    answer:
      'Yes, at any time, from your account settings — this includes your test history and your progress. Deleting is permanent, so you are asked to confirm it once.',
  },

  /* ----------------------------------------------------------------- teaching */
  {
    id: 'become-teacher',
    category: 'teaching',
    question: 'How do I become a teacher on Ntaka?',
    answer:
      'Apply through the become a teacher page. We look for native or near-native fluency, the ability to teach rather than just to speak, and a reliable internet connection. Formal teaching qualifications help but are not required — several of our strongest teachers came through community associations rather than universities.',
  },
  {
    id: 'teacher-set-schedule',
    category: 'teaching',
    question: 'Do I set my own hours and rates?',
    answer:
      'Yes, both. You set your availability as recurring weekly rules with one-off exceptions for holidays and busy weeks, and you set your own hourly and trial rates. Nothing is booked outside the hours you opened.',
  },
  {
    id: 'teacher-equipment',
    category: 'teaching',
    question: 'What equipment do I need to teach?',
    answer:
      'A laptop or desktop, a stable connection and a decent headset — the microphone matters more than the camera, especially for tonal languages. Lessons run in the browser, so there is no software to install.',
  },
];

/** FAQs in a category, in the order they are written above. */
export const faqsByCategory = () =>
  FAQ_CATEGORIES.map((category) => ({
    ...category,
    faqs: FAQS.filter((faq) => faq.category === category.id),
  })).filter((category) => category.faqs.length > 0);

/**
 * The handful worth putting in front of someone who has not asked yet. Chosen for the
 * questions that block a booking rather than the ones that are merely common.
 */
export const TOP_FAQ_IDS = [
  'why-placement-required',
  'three-modes',
  'where-lessons-happen',
  'placement-cost',
];
