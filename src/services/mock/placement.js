import { getLanguage } from '@/services/mock/catalog';
import { speakingPromptsFor, writingPromptFor } from '@/services/mock/placementTasks';
import {
  LEVEL_POINTS,
  scoreVocabulary,
  scoreWriting,
  summariseSpeaking,
  selfAssessedLevel,
  combine,
} from '@/lib/placementScoring';
import { applyWritingAssessment, isTranscribable } from '@/lib/groqAssessment';

/**
 * Ntaka's free placement check.
 *
 * Two routes:
 *  - `quiz`  — languages with an authored item bank answer graded questions (A1 → C1).
 *  - `self`  — every other language uses the CEFR can-do self-assessment.
 * Both routes finish on the same result shape, so the UI only has one ending to render.
 *
 * The banks below are launch content. Adding a language to `QUESTION_BANKS` and flipping
 * `hasPlacementBank` in catalog.js is all that is needed to move it onto the quiz route.
 */

/** Not scored — used to set expectations and to pre-fill the learner profile. */
export const BACKGROUND_QUESTIONS = [
  {
    id: 'bg-exposure',
    prompt: 'How much of this language is already around you?',
    options: [
      { id: 'none', label: 'None at all — I am starting fresh' },
      { id: 'some', label: 'I hear it sometimes, from family or music' },
      { id: 'lots', label: 'I hear it every day but do not speak it' },
      { id: 'speak', label: 'I already speak some of it' },
    ],
  },
  {
    id: 'bg-study',
    prompt: 'Have you studied it formally before?',
    options: [
      { id: 'never', label: 'Never' },
      { id: 'apps', label: 'Apps and videos only' },
      { id: 'classes', label: 'Some classes or a tutor' },
      { id: 'school', label: 'At school or university' },
    ],
  },
  {
    id: 'bg-goal',
    prompt: 'What are you learning it for?',
    options: [
      { id: 'family', label: 'Family and heritage' },
      { id: 'travel', label: 'Travel' },
      { id: 'work', label: 'Work or study' },
      { id: 'culture', label: 'Music, film and culture' },
    ],
  },
];

/** CEFR can-do statements, ordered. Used as the self-assessment route and as a sanity check. */
export const SELF_ASSESSMENT = [
  { level: 'A1', statement: 'I can greet someone and say my name.' },
  { level: 'A2', statement: 'I can shop at a market and ask for directions.' },
  { level: 'B1', statement: 'I can explain my opinion and tell a short story.' },
  { level: 'B2', statement: 'I can follow a fast conversation between native speakers.' },
  { level: 'C1', statement: 'I can use proverbs and shift register appropriately.' },
  { level: 'C2', statement: 'I can follow oral poetry and reconstruct arguments precisely.' },
];

const q = (id, level, prompt, options, answerId, note) => ({
  id,
  level,
  prompt,
  options: options.map(([oid, label]) => ({ id: oid, label })),
  answerId,
  note,
});

export const QUESTION_BANKS = {
  yoruba: [
    q('yo1', 'A1', 'What does “Ẹ kú àárọ̀” mean?', [
      ['a', 'Good morning'], ['b', 'Good night'], ['c', 'Thank you'], ['d', 'Goodbye'],
    ], 'a', '“Ẹ kú …” opens most Yorùbá greetings; àárọ̀ is morning.'),
    q('yo2', 'A1', 'How do you say “thank you”?', [
      ['a', 'Ẹ káàbọ̀'], ['b', 'Ẹ ṣé'], ['c', 'Ó dàbọ̀'], ['d', 'Jọ̀wọ́'],
    ], 'b', 'Ẹ káàbọ̀ = welcome, Ó dàbọ̀ = goodbye, Jọ̀wọ́ = please.'),
    q('yo3', 'A2', '“Mo fẹ́ jẹun” means…', [
      ['a', 'I am tired'], ['b', 'I want to eat'], ['c', 'I am going home'], ['d', 'I do not know'],
    ], 'b', 'Mo = I, fẹ́ = want, jẹun = to eat.'),
    q('yo4', 'A2', 'How do you say “my house”?', [
      ['a', 'Mi ilé'], ['b', 'Ilé mi'], ['c', 'Ilé rẹ'], ['d', 'Ilé wọn'],
    ], 'b', 'Possessives follow the noun in Yorùbá: ilé (house) + mi (my).'),
    q('yo5', 'B1', '“Ó ń lọ sí ọjà” means…', [
      ['a', 'She went to the market'], ['b', 'She is going to the market'],
      ['c', 'She will go to the market'], ['d', 'She does not go to the market'],
    ], 'b', 'The particle ń marks ongoing action.'),
    q('yo6', 'B1', 'Which word marks future action?', [
      ['a', 'ń'], ['b', 'ti'], ['c', 'yóò'], ['d', 'kò'],
    ], 'c', 'yóò (or máa) marks the future; kò is negation.'),
    q('yo7', 'B2', '“Ọwọ́ ọmọdé kò tó pẹpẹ, ti àgbàlagbà kò wọ akèrègbè” teaches that…', [
      ['a', 'Children should be seen and not heard'],
      ['b', 'Everyone needs everyone — young and old each have their role'],
      ['c', 'Wealth comes to the patient'],
      ['d', 'Do not trust strangers'],
    ], 'b', 'A child cannot reach the shelf; an elder cannot fit a hand into the gourd.'),
    q('yo8', 'C1', 'Addressing an elder respectfully, which pronoun do you use?', [
      ['a', 'O'], ['b', 'Ẹ'], ['c', 'Mo'], ['d', 'Wọ́n (for the elder speaking of themselves)'],
    ], 'b', 'The plural Ẹ is used as an honorific for a single elder.'),
  ],

  igbo: [
    q('ig1', 'A1', 'What does “Kedu” mean?', [
      ['a', 'Goodbye'], ['b', 'How are you?'], ['c', 'Please'], ['d', 'Sorry'],
    ], 'b'),
    q('ig2', 'A1', '“Daalụ” means…', [
      ['a', 'Thank you'], ['b', 'Welcome'], ['c', 'Good night'], ['d', 'Excuse me'],
    ], 'a'),
    q('ig3', 'A2', 'How do you say “My name is Ada”?', [
      ['a', 'Ada bụ m aha'], ['b', 'Aha m bụ Ada'], ['c', 'M aha bụ Ada'], ['d', 'Bụ aha Ada m'],
    ], 'b', 'Aha m = my name, bụ = is.'),
    q('ig4', 'A2', '“Ụlọ akwụkwọ” is…', [
      ['a', 'A market'], ['b', 'A school'], ['c', 'A hospital'], ['d', 'A church'],
    ], 'b', 'Literally “house of books”.'),
    q('ig5', 'B1', 'Which prefix marks ongoing action, as in “Ọ na-eri nri”?', [
      ['a', 'ga-'], ['b', 'na-'], ['c', 'ka-'], ['d', 'ma-'],
    ], 'b', 'na- gives the progressive: “she is eating food”.'),
    q('ig6', 'B1', '“Ọ ga-abịa echi” means…', [
      ['a', 'He came yesterday'], ['b', 'He is coming now'],
      ['c', 'He will come tomorrow'], ['d', 'He never comes'],
    ], 'c', 'ga- marks the future; echi = tomorrow.'),
    q('ig7', 'B2', '“Onye aghala nwanne ya” means…', [
      ['a', 'Let no one abandon their kin'], ['b', 'A stranger is a friend you have not met'],
      ['c', 'Work before rest'], ['d', 'Respect the elders'],
    ], 'a'),
    q('ig8', 'C1', 'At a gathering, the call “Igbo kwenu!” is…', [
      ['a', 'A farewell'], ['b', 'A prayer before food'],
      ['c', 'A call to solidarity, answered by the crowd'], ['d', 'A market announcement'],
    ], 'c'),
  ],

  hausa: [
    q('ha1', 'A1', '“Sannu” is used to…', [
      ['a', 'Say hello'], ['b', 'Say sorry'], ['c', 'Ask a price'], ['d', 'Say goodbye'],
    ], 'a'),
    q('ha2', 'A1', 'How do you say “thank you”?', [
      ['a', 'Barka'], ['b', 'Na gode'], ['c', 'Sai anjima'], ['d', 'Yaya dai'],
    ], 'b'),
    q('ha3', 'A2', '“Ina kwana?” literally asks…', [
      ['a', 'Where are you going?'], ['b', 'How did you sleep?'],
      ['c', 'What is your name?'], ['d', 'How much is it?'],
    ], 'b', 'The standard morning greeting.'),
    q('ha4', 'A2', '“Ruwa” means…', [
      ['a', 'Bread'], ['b', 'Water'], ['c', 'Road'], ['d', 'House'],
    ], 'b'),
    q('ha5', 'B1', 'Hausa distinguishes gender in the second person. “You” speaking to a woman is…', [
      ['a', 'kai'], ['b', 'ke'], ['c', 'ku'], ['d', 'shi'],
    ], 'b', 'kai = you (m), ke = you (f), ku = you (plural).'),
    q('ha6', 'B1', '“Zan tafi kasuwa” means…', [
      ['a', 'I went to the market'], ['b', 'I will go to the market'],
      ['c', 'I am at the market'], ['d', 'I do not go to the market'],
    ], 'b', 'zan = I will; kasuwa = market.'),
    q('ha7', 'B2', '“Haƙuri maganin duniya” means…', [
      ['a', 'Patience is the medicine of the world'], ['b', 'Money answers everything'],
      ['c', 'The traveller learns most'], ['d', 'A guest is a blessing'],
    ], 'a'),
    q('ha8', 'C1', 'Hausa is written in two scripts. Alongside the Latin “boko”, the Arabic-based script is called…', [
      ['a', 'Tifinagh'], ['b', 'Ajami'], ['c', 'Nsibidi'], ['d', "Ge'ez"],
    ], 'b'),
  ],

  swahili: [
    q('sw1', 'A1', '“Habari” is used to…', [
      ['a', 'Ask how someone is'], ['b', 'Say thank you'], ['c', 'Say goodbye'], ['d', 'Apologise'],
    ], 'a'),
    q('sw2', 'A1', '“Asante sana” means…', [
      ['a', 'Good morning'], ['b', 'Thank you very much'], ['c', 'See you later'], ['d', 'Please help'],
    ], 'b'),
    q('sw3', 'A2', 'The plural of “kitabu” (book) is…', [
      ['a', 'kitabus'], ['b', 'vitabu'], ['c', 'makitabu'], ['d', 'kitabuni'],
    ], 'b', 'The ki-/vi- noun class.'),
    q('sw4', 'A2', '“Ninakwenda sokoni” means…', [
      ['a', 'I am going to the market'], ['b', 'I went to school'],
      ['c', 'I like the market'], ['d', 'I am at home'],
    ], 'a'),
    q('sw5', 'B1', 'Which infix marks the future tense?', [
      ['a', '-li-'], ['b', '-na-'], ['c', '-ta-'], ['d', '-me-'],
    ], 'c', '-li- past, -na- present, -ta- future, -me- perfect.'),
    q('sw6', 'B1', '“Nilikuwa nikisoma” means…', [
      ['a', 'I will be reading'], ['b', 'I was reading'],
      ['c', 'I have read'], ['d', 'I want to read'],
    ], 'b'),
    q('sw7', 'B2', '“Haraka haraka haina baraka” means…', [
      ['a', 'Hurry hurry has no blessing'], ['b', 'A guest is a blessing'],
      ['c', 'Unity is strength'], ['d', 'The river does not run backwards'],
    ], 'a'),
    q('sw8', 'C1', 'Which is the correct subjunctive, “so that I may read”?', [
      ['a', 'ninasoma'], ['b', 'nilisoma'], ['c', 'nisome'], ['d', 'nitasoma'],
    ], 'c', 'The subjunctive replaces the final -a with -e.'),
  ],

  zulu: [
    q('zu1', 'A1', '“Sawubona” is said to…', [
      ['a', 'One person'], ['b', 'A group'], ['c', 'An animal'], ['d', 'Nobody — it is a farewell'],
    ], 'a', 'To a group you say “Sanibonani”.'),
    q('zu2', 'A1', '“Ngiyabonga” means…', [
      ['a', 'I am sorry'], ['b', 'I thank you'], ['c', 'I am leaving'], ['d', 'I understand'],
    ], 'b'),
    q('zu3', 'A2', 'Which three letters write the Nguni click consonants?', [
      ['a', 'b, d, g'], ['b', 'c, q, x'], ['c', 'h, l, r'], ['d', 'k, p, t'],
    ], 'b'),
    q('zu4', 'A2', '“Igama lami ngu-Thandi” means…', [
      ['a', 'I live in Durban'], ['b', 'My name is Thandi'],
      ['c', 'I am learning Zulu'], ['d', 'This is my friend Thandi'],
    ], 'b'),
    q('zu5', 'B1', 'The plural of “umuntu” (person) is…', [
      ['a', 'abantu'], ['b', 'imintu'], ['c', 'amantu'], ['d', 'izintu'],
    ], 'a', 'The umu-/aba- class for people.'),
    q('zu6', 'B1', '“Ngiyafunda” means…', [
      ['a', 'I am learning'], ['b', 'I am hungry'], ['c', 'I am leaving'], ['d', 'I am listening'],
    ], 'a'),
    q('zu7', 'B2', '“Umuntu ngumuntu ngabantu” expresses…', [
      ['a', 'Ubuntu — a person is a person through other people'],
      ['b', 'Hard work brings wealth'],
      ['c', 'Family comes before all'],
      ['d', 'Respect your elders'],
    ], 'a'),
    q('zu8', 'C1', '“Hlonipha” refers to…', [
      ['a', 'A greeting used at dawn'], ['b', 'A respect register, including avoidance vocabulary'],
      ['c', 'A style of praise singing'], ['d', 'A form of the past tense'],
    ], 'b'),
  ],

  twi: [
    q('tw1', 'A1', '“Ɛte sɛn?” means…', [
      ['a', 'How are you?'], ['b', 'Where are you going?'], ['c', 'What is this?'], ['d', 'How much?'],
    ], 'a'),
    q('tw2', 'A1', '“Medaase” means…', [
      ['a', 'Thank you'], ['b', 'Welcome'], ['c', 'Good night'], ['d', 'Please'],
    ], 'a'),
    q('tw3', 'A2', '“Akwaaba” is said to…', [
      ['a', 'Welcome someone'], ['b', 'Say farewell'], ['c', 'Apologise'], ['d', 'Give thanks'],
    ], 'a'),
    q('tw4', 'A2', 'How do you say “My name is Ama”?', [
      ['a', 'Me din de Ama'], ['b', 'Ama de me din'], ['c', 'Me Ama din de'], ['d', 'Din me de Ama'],
    ], 'a'),
    q('tw5', 'B1', 'In “Merekɔ”, the “re-” marks…', [
      ['a', 'The past'], ['b', 'Ongoing action'], ['c', 'Negation'], ['d', 'A question'],
    ], 'b', 'Me-re-kɔ = I am going.'),
    q('tw6', 'B1', 'A man born on Friday is traditionally named…', [
      ['a', 'Kwame'], ['b', 'Kofi'], ['c', 'Yaw'], ['d', 'Kwaku'],
    ], 'b', 'Akan day-names: Kwame (Sat), Kofi (Fri), Yaw (Thu), Kwaku (Wed).'),
    q('tw7', 'B2', 'The Adinkra symbol “Sankofa” teaches that…', [
      ['a', 'It is not wrong to go back for what you have forgotten'],
      ['b', 'Only God knows the future'],
      ['c', 'Strength comes from unity'],
      ['d', 'Wealth follows the diligent'],
    ], 'a'),
    q('tw8', 'C1', 'Twi is a dialect cluster of which larger language?', [
      ['a', 'Ewe'], ['b', 'Ga'], ['c', 'Akan'], ['d', 'Dagbani'],
    ], 'c', 'Asante Twi, Akuapem Twi and Fante are all Akan.'),
  ],

  wolof: [
    q('wo1', 'A1', '“Na nga def?” means…', [
      ['a', 'How are you?'], ['b', 'What is your name?'], ['c', 'Where do you live?'], ['d', 'How much?'],
    ], 'a'),
    q('wo2', 'A1', '“Jërëjëf” means…', [
      ['a', 'Please'], ['b', 'Thank you'], ['c', 'Sorry'], ['d', 'Goodbye'],
    ], 'b'),
    q('wo3', 'A2', '“Maa ngi tudd Awa” means…', [
      ['a', 'I am from Awa'], ['b', 'My name is Awa'], ['c', 'I am with Awa'], ['d', 'I am calling Awa'],
    ], 'b'),
    q('wo4', 'A2', '“Ndank ndank” means…', [
      ['a', 'Slowly, slowly'], ['b', 'Very good'], ['c', 'Right now'], ['d', 'Not at all'],
    ], 'a', 'From the proverb about catching the monkey in the bush.'),
    q('wo5', 'B1', '“Dama bëgg ndox” means…', [
      ['a', 'I want water'], ['b', 'I drank water'], ['c', 'There is no water'], ['d', 'Where is the water?'],
    ], 'a'),
    q('wo6', 'B1', 'Unlike most of its neighbours, Wolof is…', [
      ['a', 'Tonal'], ['b', 'Not tonal'], ['c', 'Written only in Arabic script'], ['d', 'A creole'],
    ], 'b'),
    q('wo7', 'B2', '“Teranga”, the word Senegal is known for, means…', [
      ['a', 'Hospitality'], ['b', 'Patience'], ['c', 'Courage'], ['d', 'Wisdom'],
    ], 'a'),
    q('wo8', 'C1', 'Wolof marks emphasis by choosing a conjugation. “Dama …” emphasises…', [
      ['a', 'The subject'], ['b', 'The verb or the explanation'], ['c', 'The object'], ['d', 'The time'],
    ], 'b', 'Compare “maa ngi …” (presentative) and “… laa” (object focus).'),
  ],

  amharic: [
    q('am1', 'A1', '“ሰላም (selam)” means…', [
      ['a', 'Peace — used as hello'], ['b', 'Thank you'], ['c', 'Goodbye only'], ['d', 'Excuse me'],
    ], 'a'),
    q('am2', 'A1', '“አመሰግናለሁ (ameseginalehu)” means…', [
      ['a', 'I am sorry'], ['b', 'Thank you'], ['c', 'I understand'], ['d', 'Please repeat'],
    ], 'b'),
    q('am3', 'A2', 'The Ethiopic script used for Amharic is called…', [
      ['a', 'Tifinagh'], ['b', 'Nsibidi'], ['c', "Ge'ez (fidäl)"], ['d', 'Vai'],
    ], 'c'),
    q('am4', 'A2', 'Each Ethiopic character represents…', [
      ['a', 'A single consonant'], ['b', 'A consonant plus a vowel'],
      ['c', 'A whole word'], ['d', 'A tone'],
    ], 'b', 'It is an abugida — seven vowel forms per consonant.'),
    q('am5', 'B1', '“ስሜ ዳዊት ነው (sime Dawit new)” means…', [
      ['a', 'My name is Dawit'], ['b', 'This is Dawit'],
      ['c', 'Dawit is my friend'], ['d', 'I am looking for Dawit'],
    ], 'a'),
    q('am6', 'B1', 'The basic Amharic word order is…', [
      ['a', 'Subject – Verb – Object'], ['b', 'Verb – Subject – Object'],
      ['c', 'Subject – Object – Verb'], ['d', 'Object – Verb – Subject'],
    ], 'c'),
    q('am7', 'B2', '“ቀስ በቀስ እንቁላል በእግሩ ይሄዳል” means…', [
      ['a', 'Slowly, slowly, an egg will walk on its legs'],
      ['b', 'The lion sleeps when the herd is calm'],
      ['c', 'A borrowed cloth never fits'],
      ['d', 'Rain falls on every roof'],
    ], 'a'),
    q('am8', 'C1', 'To address someone politely in Amharic you…', [
      ['a', 'Add a suffix and use plural verb forms'],
      ['b', 'Drop the subject pronoun'],
      ['c', 'Switch to Ge’ez vocabulary'],
      ['d', 'Speak in the past tense'],
    ], 'a', 'Formal address uses plural-marked forms such as -ዎት.'),
  ],
};

export const hasQuizFor = (languageId) => Boolean(QUESTION_BANKS[languageId]);

/** Assemble the full test definition the UI walks through. */
export function buildTest(languageId) {
  const language = getLanguage(languageId);
  const quiz = QUESTION_BANKS[languageId] ?? null;
  return {
    languageId,
    languageName: language?.name ?? 'this language',
    language,
    mode: quiz ? 'quiz' : 'self',
    background: BACKGROUND_QUESTIONS,
    questions: quiz ?? [],
    writingPrompt: writingPromptFor(languageId),
    speakingPrompts: speakingPromptsFor(languageId),
    selfAssessment: SELF_ASSESSMENT,
    maxScore: quiz ? quiz.reduce((n, item) => n + LEVEL_POINTS[item.level], 0) : null,
    estimatedMinutes: quiz ? 7 : 5,
  };
}

/**
 * Grade a submission across all four skills.
 *
 * The judgement lives in lib/placementScoring.js, which documents what each skill can and
 * cannot honestly be scored on. This only assembles the pieces and keeps a few flat
 * fields for screens that care only about the quiz.
 */
export function scoreTest({
  languageId,
  answers = {},
  selfChecked = [],
  background = {},
  writingResponse = '',
  recordings = [],
  /* Optional. Produced by server/assess-placement.js when GROQ_API_KEY is configured.
     Absent, malformed or low-confidence verdicts leave the heuristic untouched, so the
     learner still gets a result when Groq is down or rate-limited. */
  writingVerdict = null,
  speakingSignals = null,
}) {
  const test = buildTest(languageId);

  const vocabulary = scoreVocabulary(test.questions, answers);
  const writing = applyWritingAssessment(
    scoreWriting({
      response: writingResponse,
      prompt: test.writingPrompt,
      language: test.language,
    }),
    writingVerdict,
  );

  const speaking = {
    ...summariseSpeaking(recordings),
    transcribable: isTranscribable(languageId),
    signals: speakingSignals,
  };
  const selfLevel = selfAssessedLevel(selfChecked, SELF_ASSESSMENT);

  const outcome = combine({ vocabulary, writing, speaking, selfLevel });

  return {
    languageId,
    mode: test.mode,
    level: outcome.level,
    confidence: outcome.confidence,
    adjusted: outcome.adjusted,
    reasons: outcome.reasons,
    pendingReview: outcome.pendingReview,
    selfLevel,
    skills: { vocabulary, writing, speaking },
    score: vocabulary?.score ?? null,
    maxScore: vocabulary?.maxScore ?? null,
    correctCount: vocabulary?.correctCount ?? null,
    totalQuestions: vocabulary?.total ?? 0,
    breakdown: vocabulary?.breakdown ?? [],
    background,
  };
}
