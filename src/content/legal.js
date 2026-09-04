/**
 * Privacy, Terms and Cookies.
 *
 * Deliberately NOT under services/mock — this is real published content, and when the
 * mock layer is deleted in favour of a backend, these must not go with it.
 *
 * IMPORTANT, and the reason this comment is long: these are drafts written to match what
 * the code actually does, not legal advice. Every factual claim in them is traceable to
 * an implementation detail — the consent gate in server/assess-placement.js, the storage
 * keys in learnerSlice and authSlice, the Groq models in lib/groqAssessment.js. That makes
 * them accurate, which is the hard part. It does not make them reviewed. Before launch a
 * lawyer in your jurisdiction needs to read them, and the bracketed items below need real
 * values: the registered entity name, the trading address, and whether you are required
 * to register with the NDPC.
 *
 * SUB-PROCESSORS ARE LOAD-BEARING. The FAQ and the footer both promise that recordings go
 * to a named third party only with consent. That promise is only honest if the third
 * party is actually named, which is what `SUBPROCESSORS` below does. If you swap Groq for
 * another provider, or add one, this list is the thing that has to change first.
 */

export const LAST_UPDATED = '2026-09-04';

/** Filled in where the policies need a real-world identity behind the product. */
export const ENTITY = {
  name: 'Ntaka',
  contact: 'privacy@ntaka.com',
  legal: 'legal@ntaka.com',
};

/**
 * Every third party that touches learner data, what it touches, and why. A GDPR Article 13
 * disclosure needs recipients named, and a consent to transcription is not informed unless
 * the person can see who is doing the transcribing.
 */
export const SUBPROCESSORS = [
  {
    name: 'Groq',
    purpose: 'Speech transcription and written-answer assessment for the placement test',
    data: 'Placement test audio recordings and written answers',
    region: 'United States',
    note: 'Only ever called after you have explicitly agreed to it on the recording screen. Audio is sent for transcription, a result is returned, and the audio is not retained by us.',
  },
  {
    name: 'Daily.co',
    purpose: 'Live video for 1-on-1 lessons and group classes',
    data: 'Audio and video during a lesson, and a short-lived join token',
    region: 'United States',
    note: 'Lessons are not recorded unless you and your teacher both agree in advance.',
  },
  {
    name: 'Supabase',
    purpose: 'Database, authentication and file storage',
    data: 'Account details, bookings, placement results, course progress',
    region: 'European Union',
    note: 'The primary store for your account.',
  },
  {
    name: 'Payment provider',
    purpose: 'Taking payments and paying teachers',
    data: 'Transaction amounts and payment identifiers',
    region: 'Varies by method',
    note: 'Card details are entered with the provider directly. Ntaka never sees or stores a full card number.',
  },
];

/* ------------------------------------------------------------------- privacy */

export const PRIVACY = [
  {
    id: 'who-we-are',
    heading: 'Who we are',
    paragraphs: [
      `${ENTITY.name} operates this platform for learning African languages. When you use it, we decide how and why your personal data is processed, which makes us the data controller for it.`,
      `For anything in this policy, including a request to see or delete your data, write to ${ENTITY.contact}.`,
    ],
  },
  {
    id: 'what-we-collect',
    heading: 'What we collect',
    paragraphs: ['We collect four kinds of data, and nothing that is not on this list.'],
    list: [
      'Account data. Your name, email address, password (stored hashed, never in readable form), the languages you are learning, and your time zone.',
      'Placement test data. Your answers to the word and writing sections, your audio recordings from the speaking section, the level you were placed at, and the history of your attempts.',
      'Learning data. Lessons and classes you book, attendance, course progress, quiz results, certificates, and messages with your teacher.',
      'Technical data. Your IP address, browser and device type, and the pages you visit here, used to keep the service working and secure.',
    ],
  },
  {
    id: 'voice-recordings',
    heading: 'Your voice recordings, specifically',
    paragraphs: [
      'The speaking section of the placement test records you. Because a recording of your voice deserves a plainer answer than the rest of this policy, here is exactly what happens to one.',
      'You are asked to agree before anything is recorded. If you decline, nothing is captured and nothing is sent anywhere — the rest of the test still works, and you are placed on your reading and writing instead.',
      'If you agree, the recording is sent to Groq, named in the sub-processor list below, which converts it to text. That text and a short summary go to a teacher, who confirms your level. The recording is used to assess that attempt and is then discarded. We do not build a library of your voice, we do not sell it, and neither we nor our providers use it to train models.',
      'Automatic transcription does not yet cover every language we teach. Where it does not — Igbo is the current example — no recording is sent to any third party at all; it goes straight to a teacher.',
    ],
  },
  {
    id: 'why-we-use-it',
    heading: 'Why we are allowed to use it',
    paragraphs: [
      'Under the GDPR we must have a lawful basis for each use. Ours are:',
    ],
    list: [
      'To perform our contract with you: running your account, taking bookings, delivering lessons, taking payment.',
      'Your consent: recording and transcribing your voice, and any non-essential storage on your device. You can withdraw consent at any time, and withdrawing it does not affect what was done beforehand.',
      'Our legitimate interests: keeping the platform secure, preventing fraud and abuse, and improving how well the placement test places people.',
      'Our legal obligations: keeping tax and accounting records for the periods the law requires.',
    ],
  },
  {
    id: 'sharing',
    heading: 'Who else sees it',
    paragraphs: [
      'We do not sell your personal data, and we do not share it for advertising. It is never used to train AI models, ours or anyone else’s.',
      'Your teacher sees what they need to teach you: your name, your level, your placement summary, and your booking history with them. Other learners in a group class see only your display name.',
      'Beyond that, the only recipients are the service providers listed below, each of which is contractually restricted to processing data on our instructions.',
    ],
  },
  {
    id: 'subprocessors',
    heading: 'Service providers',
    subprocessors: true,
    paragraphs: [
      'We update this list before adding a provider that would handle your data, not after.',
    ],
  },
  {
    id: 'transfers',
    heading: 'Sending data outside your country',
    paragraphs: [
      'Some of the providers above operate in the United States, so your data may be processed outside Nigeria, the UK and the EEA.',
      'Where that happens we rely on the transfer mechanisms the law provides — Standard Contractual Clauses for transfers out of the EEA and the UK, and the equivalent safeguards required by the Nigeria Data Protection Act. You can ask us for a copy of the safeguards that apply to a particular transfer.',
    ],
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    list: [
      'Placement recordings: discarded once the attempt has been assessed.',
      'Placement results and test history: for as long as your account exists, because your progress over time is the point of keeping them.',
      'Account and learning data: for as long as your account exists, and deleted when you delete it.',
      'Payment and tax records: for as long as tax law requires, which is longer than your account may last.',
      'Technical logs: a short rolling window, kept for security and troubleshooting.',
    ],
  },
  {
    id: 'your-rights',
    heading: 'Your rights',
    paragraphs: [
      'You can ask us to give you a copy of your data, correct it, delete it, hand it to you in a portable format, restrict what we do with it, or object to processing we base on legitimate interests. Where we rely on your consent, you can withdraw it.',
      `Most of these you can do yourself from your account settings, including deleting your account and your test history. For anything else, write to ${ENTITY.contact} and we will respond within one month.`,
      'If you think we have handled your data badly, please tell us first so we can put it right. You also have the right to complain to a regulator: the Nigeria Data Protection Commission, or the supervisory authority in your country if you are in the EEA or the UK.',
    ],
  },
  {
    id: 'security',
    heading: 'How we protect it',
    paragraphs: [
      'Data is encrypted in transit. Passwords are stored hashed, so nobody at Ntaka can read yours. Access to production data is limited to the people who need it to run the service.',
      'No system is perfect, and we would rather say so than claim otherwise. If a breach affects your data and puts you at risk, we will tell you and the regulator within the timeframes the law sets.',
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    paragraphs: [
      'Ntaka is for people aged 16 and over. Younger learners are welcome with a parent or guardian holding the account and consenting on their behalf. If we learn that we hold data for a child outside those terms, we delete it.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    paragraphs: [
      'When we change something that matters — a new provider, a new use of your data — we will tell you before it takes effect, not quietly update the date at the top.',
    ],
  },
];

/* --------------------------------------------------------------------- terms */

export const TERMS = [
  {
    id: 'agreement',
    heading: 'This agreement',
    paragraphs: [
      `These terms are the agreement between you and ${ENTITY.name} for use of this platform. By creating an account you accept them. If you do not, please do not use the service.`,
    ],
  },
  {
    id: 'accounts',
    heading: 'Your account',
    list: [
      'You must be 16 or over to hold an account, or have a parent or guardian hold one for you.',
      'The details you give us must be accurate, and the account is yours alone — do not share your login.',
      'You are responsible for what happens under your account. Tell us immediately if you think someone else has access to it.',
    ],
  },
  {
    id: 'placement',
    heading: 'The placement test',
    paragraphs: [
      'The placement test is free and is required once per language before you can book lessons, join classes or start a course in that language. We ask for it because placing someone at the wrong level is the most reliable way to waste their money and their time.',
      'The level it gives you is an assessment, not a qualification. Your teacher may adjust it after meeting you, and you can retake the test whenever you think you have moved on.',
    ],
  },
  {
    id: 'bookings',
    heading: 'Lessons, classes and courses',
    list: [
      'Lessons must be booked at least two hours before they start, so your teacher has time to prepare.',
      'A lesson can be joined from 10 minutes before it starts until 15 minutes after it ends.',
      'You can reschedule or cancel from your dashboard. Cancelling well in advance is free; a late cancellation may still be charged, because your teacher has already reserved that time. The applicable window is shown to you before you confirm.',
      'If a teacher does not attend, or a fault on our side prevents a lesson, you are refunded in full.',
      'Group classes run subject to a minimum number of learners. If a class does not run, you are refunded.',
    ],
  },
  {
    id: 'payments',
    heading: 'Payments',
    list: [
      'Prices are shown in full before you book. There is no subscription and no fee added at checkout.',
      'Payment is taken at the time of booking, through our payment provider.',
      'Teachers are paid for lessons that took place, on our regular payout cycle, net of the platform fee shown in the teacher terms.',
    ],
  },
  {
    id: 'conduct',
    heading: 'How to behave here',
    paragraphs: [
      'Ntaka exists because people are willing to teach their language to strangers. That only works if it is a decent place to be.',
    ],
    list: [
      'Treat teachers and other learners with respect. Harassment, discrimination and abuse end an account.',
      'Do not record a lesson without everyone in it agreeing first.',
      'Do not take teaching off the platform to avoid fees, and do not use the service to advertise anything else.',
      'Do not share, resell or republish course material. It belongs to the teacher who made it.',
    ],
  },
  {
    id: 'teachers',
    heading: 'If you teach on Ntaka',
    list: [
      'You are an independent contractor, not our employee. You set your own availability and your own rates.',
      'You keep ownership of the course material you create, and grant us the licence needed to host it and show it to your learners.',
      'You are responsible for your own taxes in your own country.',
      'Turning up matters. Repeatedly missing lessons you have accepted will end your listing.',
    ],
  },
  {
    id: 'certificates',
    heading: 'Certificates',
    paragraphs: [
      'Certificates record that you completed a course and passed its assessments at a stated CEFR level. They are issued by Ntaka. They are not a state or university qualification, and we do not claim they are — we say this plainly because a certificate that overstates itself is worth less than none.',
    ],
  },
  {
    id: 'availability',
    heading: 'Availability of the service',
    paragraphs: [
      'We work to keep the platform running, but we do not promise it will be uninterrupted. Maintenance, provider outages and connection problems happen. Where a fault on our side stops a lesson you paid for, you are refunded.',
    ],
  },
  {
    id: 'liability',
    heading: 'Liability',
    paragraphs: [
      'Nothing here limits our liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot be limited by law.',
      'Beyond that, our liability to you is limited to the amount you have paid us in the twelve months before the claim, and we are not liable for indirect or consequential loss.',
    ],
  },
  {
    id: 'ending',
    heading: 'Ending the agreement',
    paragraphs: [
      'You can close your account at any time from your settings. We may suspend or close an account that breaches these terms, and we will tell you why unless we are legally prevented from doing so.',
      'Closing your account does not cancel a lesson already booked and paid for; either attend it or cancel it first.',
    ],
  },
  {
    id: 'law',
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of Nigeria have jurisdiction. If you are a consumer elsewhere, this does not remove protections you have under your own local law.',
      `Questions about these terms go to ${ENTITY.legal}.`,
    ],
  },
];

/* ------------------------------------------------------------------- cookies */

/**
 * Written against what the app really stores. Ntaka uses browser storage rather than
 * cookies for almost everything, and saying "we use cookies" when we do not would be both
 * inaccurate and, in a policy whose whole job is accuracy, a bad sign.
 */
export const STORAGE_ITEMS = [
  {
    key: 'ntaka.session.v1',
    kind: 'Local storage',
    purpose: 'Keeps you signed in across a page refresh',
    life: 'Until it expires or you sign out',
    essential: true,
  },
  {
    key: 'ntaka.learner.v1:<your user id>',
    kind: 'Local storage',
    purpose: 'Your placement level, test history and saved teachers, so the app can show them without a round trip',
    life: 'Until you sign out on this device or delete your account',
    essential: true,
  },
  {
    key: 'ntaka.theme',
    kind: 'Local storage',
    purpose: 'Remembers whether you chose day or night mode',
    life: 'Until you clear your browser storage',
    essential: false,
  },
];

export const COOKIES = [
  {
    id: 'what-we-use',
    heading: 'What we actually use',
    paragraphs: [
      'Very little, and none of it for advertising. Ntaka sets no advertising cookies, no third-party tracking pixels, and no cross-site profiling of any kind. We are not in that business.',
      'What we do use is your browser’s local storage, which is similar to a cookie but is never sent to our servers with each request. It stays on your device. The full list is below — it is short enough to print in full rather than describe in categories.',
    ],
  },
  {
    id: 'the-list',
    heading: 'Everything we store on your device',
    storage: true,
  },
  {
    id: 'video',
    heading: 'During a lesson',
    paragraphs: [
      'Live lessons run through Daily.co, which sets its own storage in your browser to make the video call work. That is limited to the lesson itself and is covered by the sub-processor entry in our privacy policy.',
    ],
  },
  {
    id: 'controlling',
    heading: 'Turning it off',
    paragraphs: [
      'The items marked essential are what makes signing in work; clearing them signs you out, and blocking them means you cannot use an account at all.',
      'You can clear everything at any time through your browser’s settings for this site, or by signing out — which removes your placement results from this device while keeping them on your account.',
    ],
  },
];

export const LEGAL_PAGES = {
  privacy: { path: '/privacy', label: 'Privacy', sections: PRIVACY },
  terms: { path: '/terms', label: 'Terms', sections: TERMS },
  cookies: { path: '/cookies', label: 'Cookies', sections: COOKIES },
};
