/**
 * Organisations Ntaka works with.
 *
 * Adding one is an entry here plus a source file in `art/partners/`, then
 * `./scripts/build-partner-logos.sh` to normalise it. Everything that renders partners —
 * the homepage band, the partners page, the footer — reads this list, so the set cannot
 * fall out of step with itself.
 *
 * Names are taken from what the logos actually say, not from their filenames. Two did not
 * match: `Uganda_Ministry_of_Art_Culture` is the Museum of Acholi Art and Culture, which
 * is a museum rather than a ministry, and `Igbo_Association_Icon` is the Edmonton
 * association, which is Canadian diaspora rather than Nigerian.
 *
 * `blurb` describes the organisation, never the arrangement. What each partnership
 * actually covers is a claim only you can make accurately.
 */
export const PARTNERS = [
  {
    id: 'fmacce',
    name: 'Federal Ministry of Art, Culture and the Creative Economy',
    shortName: 'FMACCE',
    kind: 'government',
    country: 'Nigeria',
    logo: '/partners/Nigeria_Ministry_of_Art_Culture.webp',
    blurb:
      'The Nigerian federal ministry responsible for cultural policy and the creative sector.',
    url: null,
  },
  {
    id: 'cameroon-arts',
    name: 'Ministère des Arts et de la Culture',
    shortName: 'MINAC',
    kind: 'government',
    country: 'Cameroon',
    logo: '/partners/Cameroon_Ministry_of_Art_Culture.webp',
    blurb:
      "Cameroon's Ministry of Arts and Culture, responsible for national cultural heritage.",
    url: null,
  },
  {
    id: 'ethiopia-culture',
    name: 'Ministry of Culture and Tourism',
    shortName: 'MoCT',
    kind: 'government',
    country: 'Ethiopia',
    logo: '/partners/Ethiopia_Ministry_of_Culture_and_Tourism.webp',
    blurb:
      "Ethiopia's ministry for cultural heritage, languages and tourism.",
    url: null,
  },

  {
    id: 'yysca',
    name: 'Yorùbá Youth Socio-Cultural Association',
    shortName: 'YYSCA',
    kind: 'community',
    country: 'Nigeria',
    motto: 'Ìtẹ̀ṣíwájú Ọ̀dọ̀ Yorùbá',
    logo: '/partners/Yoruba_Icon.webp',
    blurb: 'A youth association working on Yorùbá language and cultural heritage.',
    url: null,
  },
  {
    id: 'asghal',
    name: 'Association of Ghanaian Languages',
    shortName: 'ASGHAL',
    kind: 'community',
    country: 'Ghana',
    motto: 'Our language, our pride',
    logo: '/partners/Ghana_Lang_Association_Icon.webp',
    blurb:
      'An association promoting the teaching and status of Ghanaian languages.',
    url: null,
  },
  {
    id: 'acholi-museum',
    name: 'Museum of Acholi Art and Culture',
    shortName: 'MAAC',
    kind: 'community',
    country: 'Uganda',
    motto: 'Pi gwoko deyo ki tekwaro pa Acholi',
    logo: '/partners/Uganda_Ministry_of_Art_Culture.webp',
    blurb:
      'A museum preserving Acholi art, language and heritage in northern Uganda.',
    url: null,
  },

  {
    id: 'ica-edmonton',
    name: 'Igbo Cultural Association, Edmonton',
    shortName: 'ICA',
    kind: 'diaspora',
    country: 'Canada',
    city: 'Edmonton',
    logo: '/partners/Igbo_Association_Icon.webp',
    blurb:
      'An Igbo community association in Alberta, connecting the diaspora with the language at home.',
    url: null,
  },
];

export const PARTNER_KINDS = {
  government: {
    label: 'Government & policy',
    description: 'Ministries shaping language, culture and the creative economy.',
  },
  community: {
    label: 'Community & cultural',
    description: 'Associations and museums keeping languages alive where they are spoken.',
  },
  diaspora: {
    label: 'Diaspora',
    description:
      'Associations abroad, where the hardest language to keep is the one you grew up hearing.',
  },
  education: {
    label: 'Education',
    description: 'Universities, schools and training bodies.',
  },
};

export const partnersByKind = () =>
  Object.entries(PARTNER_KINDS)
    .map(([kind, meta]) => ({
      kind,
      ...meta,
      partners: PARTNERS.filter((p) => p.kind === kind),
    }))
    .filter((group) => group.partners.length > 0);

/** Distinct countries represented, for the homepage line. */
export const partnerCountries = () => [...new Set(PARTNERS.map((p) => p.country))];
