/**
 * Conversations and reading passages for Interactive Learning.
 *
 * These are the two source materials the learning arc is built around: a learner listens
 * to two people talking and then WRITES about what they heard, and reads a short passage
 * and then SPEAKS about it. Both tasks are comprehension first and production second,
 * which is the point — answering a question about a conversation proves you understood it
 * in a way that repeating a phrase never does.
 *
 * Authored by hand for Yorùbá and Igbo, because those are the two languages this arc is
 * being built for and invented content in a language someone is trying to learn is worse
 * than no content at all. Languages without authored material fall back to phrase drills
 * rather than receiving machine-translated dialogue.
 *
 * ------------------------------------------------------------------------------------
 * NEEDS NATIVE-SPEAKER REVIEW BEFORE LAUNCH. The vocabulary, orthography and diacritics
 * here are deliberately kept at A1-A2 so they are checkable at a glance, but a native
 * teacher for each language should sign these off — particularly the tone marks, which
 * are meaning-bearing and are the single easiest thing to get wrong. Your partner
 * associations (YYSCA for Yorùbá, ICA Edmonton for Igbo) are the obvious reviewers.
 * ------------------------------------------------------------------------------------
 *
 * `expectedPoints` on each conversation is the rubric: the facts a correct answer has to
 * contain. It is what lets a comprehension answer be graded on understanding rather than
 * on grammar alone, and it is passed to the model as the marking scheme instead of
 * leaving it to invent one.
 */

export const DIALOGUES = {
  yoruba: {
    conversations: [
      {
        id: 'yo-conv-market',
        title: 'Ní ọjà — At the market',
        level: 'A1',
        setting: 'Adé is buying fruit from Bísí, a trader at the market.',
        speakers: [
          { id: 'a', name: 'Adé', role: 'Buyer' },
          { id: 'b', name: 'Bísí', role: 'Trader' },
        ],
        lines: [
          { speaker: 'a', text: 'Ẹ káàsán.', gloss: 'Good afternoon.' },
          { speaker: 'b', text: 'Ẹ káàsán. Ṣé àlàáfíà ni?', gloss: 'Good afternoon. Are you well?' },
          { speaker: 'a', text: 'Àlàáfíà ni. Mo fẹ́ ra ọ̀gẹ̀dẹ̀.', gloss: 'I am well. I want to buy bananas.' },
          { speaker: 'b', text: 'Ẹgbẹ̀rún náírà ni.', gloss: 'It is one thousand naira.' },
          { speaker: 'a', text: 'Ó dára. Ẹ ṣé.', gloss: 'That is fine. Thank you.' },
          { speaker: 'b', text: 'Ó dàbọ̀.', gloss: 'Goodbye.' },
        ],
        comprehension: {
          question: 'Kí ni Adé fẹ́ ra, mélòó ni?',
          questionGloss: 'What did Adé want to buy, and how much was it?',
          instruction:
            'Answer in Yorùbá, in two or three sentences. Say what Adé wanted to buy, what it cost, and where the conversation takes place.',
        },
        expectedPoints: [
          'Adé wanted to buy bananas (ọ̀gẹ̀dẹ̀)',
          'The price was one thousand naira (ẹgbẹ̀rún náírà)',
          'The conversation happens at a market, with a trader',
        ],
      },
      {
        id: 'yo-conv-meeting',
        title: 'Ìpàdé àkọ́kọ́ — Meeting for the first time',
        level: 'A2',
        setting: 'Túndé and Ṣadé meet at a language event and introduce themselves.',
        speakers: [
          { id: 'a', name: 'Túndé', role: 'Teacher' },
          { id: 'b', name: 'Ṣadé', role: 'Student' },
        ],
        lines: [
          { speaker: 'a', text: 'Ẹ n lẹ o. Orúkọ mi ni Túndé.', gloss: 'Hello. My name is Túndé.' },
          { speaker: 'b', text: 'Ẹ n lẹ o. Orúkọ mi ni Ṣadé. Níbo ni ẹ ti wá?', gloss: 'Hello. My name is Ṣadé. Where are you from?' },
          { speaker: 'a', text: 'Ìbàdàn ni mo ti wá. Ẹ̀yin ń kọ́?', gloss: 'I am from Ìbàdàn. And you?' },
          { speaker: 'b', text: 'Èkó ni mo ti wá. Iṣẹ́ kí ni ẹ ń ṣe?', gloss: 'I am from Lagos. What work do you do?' },
          { speaker: 'a', text: 'Olùkọ́ ni mí. Mo ń kọ́ èdè Yorùbá.', gloss: 'I am a teacher. I teach the Yorùbá language.' },
          { speaker: 'b', text: 'Ó dára gan-an. Ẹ ṣé.', gloss: 'That is very good. Thank you.' },
        ],
        comprehension: {
          question: 'Sọ nípa Túndé àti Ṣadé.',
          questionGloss: 'Write about Túndé and Ṣadé.',
          instruction:
            'Answer in Yorùbá, in three or four sentences. Say where each person is from and what Túndé does for a living.',
        },
        expectedPoints: [
          'Túndé is from Ìbàdàn',
          'Ṣadé is from Lagos (Èkó)',
          'Túndé is a teacher and teaches Yorùbá',
        ],
      },
    ],

    passages: [
      {
        id: 'yo-read-market',
        title: 'Ọjà Bísí — Bísí’s market day',
        level: 'A1',
        body: [
          'Ní gbogbo ọjọ́ Ẹtì, Bísí máa ń lọ sí ọjà.',
          'Ó máa ń ra ẹja, ìrẹsì àti ọ̀gẹ̀dẹ̀.',
          'Ọjà náà gbòòrò, ó sì kún fún ènìyàn.',
          'Bísí fẹ́ràn láti bá àwọn olùtajà sọ̀rọ̀ ní èdè Yorùbá.',
        ],
        gloss: [
          'Every Friday, Bísí goes to the market.',
          'She buys fish, rice and bananas.',
          'The market is large, and it is full of people.',
          'Bísí likes to talk with the traders in Yorùbá.',
        ],
        glossary: [
          { term: 'Ọjọ́ Ẹtì', meaning: 'Friday' },
          { term: 'Ẹja', meaning: 'Fish' },
          { term: 'Ìrẹsì', meaning: 'Rice' },
          { term: 'Olùtajà', meaning: 'Trader, seller' },
        ],
        speaking: {
          instruction:
            'Read the passage twice, then speak for about thirty seconds in Yorùbá. Do not read it back word for word — say it in your own words.',
          guidingQuestions: [
            'Nígbà wo ni Bísí máa ń lọ sí ọjà? — When does Bísí go to the market?',
            'Kí ni ó máa ń rà? — What does she buy?',
            'Ṣé ìwọ náà máa ń lọ sí ọjà? — Do you go to the market too?',
          ],
        },
      },
      {
        id: 'yo-read-family',
        title: 'Ìdílé mi — My family',
        level: 'A2',
        body: [
          'Orúkọ mi ni Yétúndé, mo sì ń gbé ní Èkó.',
          'Mo ní àbúrò kan àti ẹ̀gbọ́n obìnrin kan.',
          'Bàbá mi jẹ́ olùkọ́, ìyá mi sì ń ta aṣọ ní ọjà.',
          'Ní ọjọ́ Àìkú, gbogbo wa jọ jẹun papọ̀.',
        ],
        gloss: [
          'My name is Yétúndé, and I live in Lagos.',
          'I have one younger sibling and one older sister.',
          'My father is a teacher, and my mother sells cloth at the market.',
          'On Sunday, we all eat together.',
        ],
        glossary: [
          { term: 'Àbúrò', meaning: 'Younger sibling' },
          { term: 'Ẹ̀gbọ́n', meaning: 'Older sibling' },
          { term: 'Aṣọ', meaning: 'Cloth' },
          { term: 'Ọjọ́ Àìkú', meaning: 'Sunday' },
        ],
        speaking: {
          instruction:
            'Read the passage, then talk about your own family in Yorùbá for about thirty seconds.',
          guidingQuestions: [
            'Àwọn wo ni ó wà nínú ìdílé rẹ? — Who is in your family?',
            'Iṣẹ́ kí ni wọ́n ń ṣe? — What work do they do?',
            'Kí ni ẹ máa ń ṣe papọ̀? — What do you do together?',
          ],
        },
      },
    ],
  },

  igbo: {
    conversations: [
      {
        id: 'ig-conv-market',
        title: 'N’ahịa — At the market',
        level: 'A1',
        setting: 'Obi is buying water from Ada, a trader at the market.',
        speakers: [
          { id: 'a', name: 'Obi', role: 'Buyer' },
          { id: 'b', name: 'Ada', role: 'Trader' },
        ],
        lines: [
          { speaker: 'a', text: 'Ụtụtụ ọma.', gloss: 'Good morning.' },
          { speaker: 'b', text: 'Ụtụtụ ọma. Kedu ka ị mere?', gloss: 'Good morning. How are you?' },
          { speaker: 'a', text: 'Adị m mma. Achọrọ m ịzụ mmiri.', gloss: 'I am fine. I want to buy water.' },
          { speaker: 'b', text: 'Naịra narị abụọ ka ọ bụ.', gloss: 'It is two hundred naira.' },
          { speaker: 'a', text: 'Ọ dị mma. Daalụ.', gloss: 'That is fine. Thank you.' },
          { speaker: 'b', text: 'Ka ọ dị.', gloss: 'Goodbye.' },
        ],
        comprehension: {
          question: 'Gịnị ka Obi chọrọ ịzụ, ego ole ka ọ bụ?',
          questionGloss: 'What did Obi want to buy, and how much was it?',
          instruction:
            'Answer in Igbo, in two or three sentences. Say what Obi wanted to buy, what it cost, and where the conversation takes place.',
        },
        expectedPoints: [
          'Obi wanted to buy water (mmiri)',
          'The price was two hundred naira (naịra narị abụọ)',
          'The conversation happens at a market, with a trader',
        ],
      },
      {
        id: 'ig-conv-meeting',
        title: 'Izute na mbụ — Meeting for the first time',
        level: 'A2',
        setting: 'Emeka and Ngozi meet at a language event and introduce themselves.',
        speakers: [
          { id: 'a', name: 'Emeka', role: 'Teacher' },
          { id: 'b', name: 'Ngozi', role: 'Student' },
        ],
        lines: [
          { speaker: 'a', text: 'Kedu! Aha m bụ Emeka.', gloss: 'Hello! My name is Emeka.' },
          { speaker: 'b', text: 'Kedu! Aha m bụ Ngozi. Ebee ka i si?', gloss: 'Hello! My name is Ngozi. Where are you from?' },
          { speaker: 'a', text: 'Esi m Enugwu. Gị kwanụ?', gloss: 'I am from Enugu. And you?' },
          { speaker: 'b', text: 'Esi m Onicha. Olee ọrụ ị na-arụ?', gloss: 'I am from Onitsha. What work do you do?' },
          { speaker: 'a', text: 'Abụ m onye nkuzi. Ana m akụzi asụsụ Igbo.', gloss: 'I am a teacher. I teach the Igbo language.' },
          { speaker: 'b', text: 'Ọ dị mma nke ukwuu. Daalụ.', gloss: 'That is very good. Thank you.' },
        ],
        comprehension: {
          question: 'Dee banyere Emeka na Ngozi.',
          questionGloss: 'Write about Emeka and Ngozi.',
          instruction:
            'Answer in Igbo, in three or four sentences. Say where each person is from and what Emeka does for a living.',
        },
        expectedPoints: [
          'Emeka is from Enugu',
          'Ngozi is from Onitsha',
          'Emeka is a teacher and teaches Igbo',
        ],
      },
    ],

    passages: [
      {
        id: 'ig-read-market',
        title: 'Ahịa Ngozi — Ngozi’s market day',
        level: 'A1',
        body: [
          'Kwa izu, Ngozi na-aga ahịa.',
          'Ọ na-azụ azụ, osikapa na unere.',
          'Ahịa ahụ buru ibu, o jupụtakwara na mmadụ.',
          'Ngozi na-enwe mmasị ịgwa ndị na-ere ahịa okwu n’asụsụ Igbo.',
        ],
        gloss: [
          'Every week, Ngozi goes to the market.',
          'She buys fish, rice and bananas.',
          'That market is large, and it is full of people.',
          'Ngozi likes to talk with the traders in Igbo.',
        ],
        glossary: [
          { term: 'Kwa izu', meaning: 'Every week' },
          { term: 'Azụ', meaning: 'Fish' },
          { term: 'Osikapa', meaning: 'Rice' },
          { term: 'Ndị na-ere ahịa', meaning: 'Traders, sellers' },
        ],
        speaking: {
          instruction:
            'Read the passage twice, then speak for about thirty seconds in Igbo. Do not read it back word for word — say it in your own words.',
          guidingQuestions: [
            'Mgbe ole ka Ngozi na-aga ahịa? — When does Ngozi go to the market?',
            'Gịnị ka ọ na-azụ? — What does she buy?',
            'Ị na-agakwa ahịa? — Do you go to the market too?',
          ],
        },
      },
      {
        id: 'ig-read-family',
        title: 'Ezinụlọ m — My family',
        level: 'A2',
        body: [
          'Aha m bụ Chidi, ana m ebi na Enugwu.',
          'Enwere m otu nwanne nwoke na otu nwanne nwaanyị.',
          'Nna m bụ onye nkuzi, nne m na-erekwa akwa n’ahịa.',
          'N’ụbọchị Sọnde, anyị niile na-eri nri ọnụ.',
        ],
        gloss: [
          'My name is Chidi, and I live in Enugu.',
          'I have one brother and one sister.',
          'My father is a teacher, and my mother sells cloth at the market.',
          'On Sunday, we all eat together.',
        ],
        glossary: [
          { term: 'Ezinụlọ', meaning: 'Family' },
          { term: 'Nwanne', meaning: 'Sibling' },
          { term: 'Akwa', meaning: 'Cloth' },
          { term: 'Ụbọchị Sọnde', meaning: 'Sunday' },
        ],
        speaking: {
          instruction:
            'Read the passage, then talk about your own family in Igbo for about thirty seconds.',
          guidingQuestions: [
            'Ònye nọ n’ezinụlọ gị? — Who is in your family?',
            'Olee ọrụ ha na-arụ? — What work do they do?',
            'Gịnị ka unu na-emekọ ọnụ? — What do you do together?',
          ],
        },
      },
    ],
  },
};

/** Languages with authored dialogue. Everything else degrades to phrase drills. */
export const DIALOGUE_LANGUAGES = Object.keys(DIALOGUES);

export const hasDialogues = (languageId) => Boolean(DIALOGUES[languageId]);

/**
 * Pick deterministically by index so a learner's syllabus never reshuffles under them,
 * and wraps rather than running out on a long course.
 */
export function conversationFor(languageId, index = 0) {
  const set = DIALOGUES[languageId]?.conversations;
  if (!set?.length) return null;
  return set[index % set.length];
}

export function passageFor(languageId, index = 0) {
  const set = DIALOGUES[languageId]?.passages;
  if (!set?.length) return null;
  return set[index % set.length];
}

/** The plain transcript, which is what a comprehension answer is marked against. */
export const transcriptOf = (conversation) =>
  conversation.lines
    .map((line) => {
      const speaker = conversation.speakers.find((s) => s.id === line.speaker);
      return `${speaker?.name ?? line.speaker}: ${line.text}`;
    })
    .join('\n');
