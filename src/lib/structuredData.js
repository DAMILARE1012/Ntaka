import { SITE, absolute } from '@/lib/seo';

/**
 * Schema.org graphs. Every node here describes something that is genuinely visible on
 * the page it ships with - that is a Google requirement, not a style preference, and
 * marking up content a visitor cannot see is what gets rich results revoked.
 */

/**
 * Rating markup must describe reviews you actually collected. The ratings in this
 * catalogue are generated demo data, so emitting aggregateRating over them would be
 * telling Google something untrue - which is a manual-action risk, not a style choice.
 * Flip this on (or set VITE_REVIEWS_ARE_REAL=true) once real reviews exist.
 */
const REVIEWS_ARE_REAL = import.meta.env?.VITE_REVIEWS_ARE_REAL === 'true';

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

export const organization = () => ({
  '@type': 'EducationalOrganization',
  '@id': ORG_ID,
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  logo: { '@type': 'ImageObject', url: absolute('/ntaka-mark-512.png'), width: 512, height: 512 },
  slogan: SITE.tagline,
  areaServed: 'Worldwide',
  knowsAbout: [
    'African languages',
    'Yoruba language',
    'Igbo language',
    'Hausa language',
    'Swahili language',
    'Amharic language',
    'Zulu language',
    'CEFR language levels',
  ],
});

export const website = () => ({
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: SITE.url,
  name: SITE.name,
  description: SITE.description,
  publisher: { '@id': ORG_ID },
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.url}/languages?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbs = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((crumb, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: crumb.name,
    item: absolute(crumb.path),
  })),
});

/** Course rich results are the highest-value markup on this platform. */
export const videoCourse = (course) => ({
  '@type': 'Course',
  name: course.title,
  description: course.description,
  url: absolute(`/interactive-learning/${course.id}`),
  provider: { '@id': ORG_ID },
  inLanguage: course.languageName,
  teaches: course.promise,
  educationalLevel: course.level,
  numberOfCredits: undefined,
  aggregateRating: REVIEWS_ARE_REAL && course.reviews
    ? {
        '@type': 'AggregateRating',
        ratingValue: course.rating,
        reviewCount: course.reviews,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `PT${Math.max(1, Math.round(course.totalMinutes / 60))}H`,
    instructor: course.teacher
      ? { '@type': 'Person', name: course.teacher.name }
      : undefined,
  },
  offers: {
    '@type': 'Offer',
    price: 0,
    priceCurrency: course.currency,
    category: course.isOpen ? 'Free' : 'Subscription',
    availability: 'https://schema.org/InStock',
    url: absolute(`/interactive-learning/${course.id}`),
  },
});

/** A scheduled live class is a Course with a dated, priced instance. */
export const groupClass = (item) => ({
  '@type': 'Course',
  name: item.title,
  description: item.description,
  url: absolute(`/classes/${item.id}`),
  provider: { '@id': ORG_ID },
  inLanguage: item.languageName,
  educationalLevel: item.level,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    startDate: item.startsAt,
    courseWorkload: `PT${item.durationMins}M`,
    maximumAttendeeCapacity: item.seatsTotal,
    instructor: item.teacher ? { '@type': 'Person', name: item.teacher.name } : undefined,
    offers: {
      '@type': 'Offer',
      price: item.pricePerSeat,
      priceCurrency: item.currency,
      availability:
        item.seatsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: absolute(`/classes/${item.id}`),
    },
  },
});

export const teacherPerson = (teacher) => ({
  '@type': 'Person',
  name: teacher.name,
  url: absolute(`/teachers/${teacher.id}`),
  jobTitle: teacher.typeLabel,
  description: teacher.headline,
  knowsLanguage: teacher.speaks.map((s) => s.name),
  nationality: { '@type': 'Country', name: teacher.country },
  worksFor: { '@id': ORG_ID },
  makesOffer: {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: `${teacher.languageName} lessons with ${teacher.name}`,
      serviceType: 'Online language tuition',
    },
    price: teacher.hourlyRate,
    priceCurrency: teacher.currency,
    availability: 'https://schema.org/InStock',
  },
});

/** A language landing page describes the subject, not a single sellable course. */
export const languagePage = (language) => ({
  '@type': 'CollectionPage',
  name: `Learn ${language.name} online`,
  url: absolute(`/languages/${language.id}`),
  about: {
    '@type': 'Language',
    name: language.name,
    alternateName: language.nativeName,
  },
  isPartOf: { '@id': SITE_ID },
  publisher: { '@id': ORG_ID },
});

/** Listing pages: what the collection is, and where it sits in the site. */
export const collectionPage = ({ name, description, path, itemType }) => ({
  '@type': 'CollectionPage',
  name,
  description,
  url: absolute(path),
  isPartOf: { '@id': SITE_ID },
  publisher: { '@id': ORG_ID },
  about: itemType ? { '@type': 'Thing', name: itemType } : undefined,
});

/** The placement check is a tool, not a document. */
export const assessmentPage = ({ name, description, path }) => ({
  '@type': 'WebApplication',
  name,
  description,
  url: absolute(path),
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  isPartOf: { '@id': SITE_ID },
  publisher: { '@id': ORG_ID },
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
});

/**
 * FAQPage, which is the one schema type on this site that can win its own rich result.
 *
 * Two rules Google enforces and will penalise: the marked-up answer must be the same text
 * the visitor sees, and the answer must be visible on the page — not fetched on expand.
 * Both hold here because the page renders every answer into the DOM and only collapses it
 * with CSS, and because both the page and this function read the same `answer` strings.
 */
export const faqPage = ({ name, description, path, faqs }) => ({
  '@type': 'FAQPage',
  name,
  description,
  url: absolute(path),
  isPartOf: { '@id': SITE_ID },
  publisher: { '@id': ORG_ID },
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});

/** Wrap nodes into a single @graph and strip undefined so the JSON stays clean. */
export const graph = (...nodes) =>
  JSON.parse(
    JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }),
  );
