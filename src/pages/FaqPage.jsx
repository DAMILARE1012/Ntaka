import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Seo from '@/components/common/Seo';
import { SearchInput } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';
import { PageHeader } from '@/components/layout/PageLayout';
import { STATIC_SEO } from '@/lib/seo';
import { graph, faqPage, breadcrumbs } from '@/lib/structuredData';
import { FAQS, faqsByCategory } from '@/services/mock/faqs';

/**
 * The FAQ page.
 *
 * Built on native <details>/<summary> rather than a JavaScript accordion, for three
 * reasons that all matter here:
 *
 *   1. SEO. Every answer is in the prerendered HTML whether or not it is open, which is
 *      what FAQPage rich results require — an answer fetched on expand does not qualify.
 *   2. It works before hydration, and on the static build with JS disabled entirely.
 *   3. Keyboard and screen-reader behaviour is correct for free. A hand-rolled accordion
 *      is where aria-expanded gets forgotten.
 *
 * Search filters the list rather than jumping to a match, because someone typing "refund"
 * wants to see everything about refunds, not the first thing that mentions it.
 */

/** Match on the question *and* the answer — people search for the word in the answer. */
const matches = (faq, query) =>
  `${faq.question} ${faq.answer}`.toLowerCase().includes(query);

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const all = faqsByCategory();
    if (!term) return all;
    return all
      .map((group) => ({ ...group, faqs: group.faqs.filter((faq) => matches(faq, term)) }))
      .filter((group) => group.faqs.length > 0);
  }, [term]);

  const resultCount = groups.reduce((total, group) => total + group.faqs.length, 0);

  return (
    <>
      <Seo
        {...STATIC_SEO.faq}
        jsonLd={graph(
          // Always the full set, never the filtered view — the markup describes the page,
          // not whatever the visitor happens to have typed.
          faqPage({ ...STATIC_SEO.faq, faqs: FAQS }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description="Placement tests, lessons, levels, pricing and privacy — answered plainly."
      >
        <div className="mt-6 max-w-md">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search questions"
            aria-label="Search frequently asked questions"
          />
        </div>
      </PageHeader>

      <div className="container py-12">
        {term && (
          <p aria-live="polite" className="mb-8 text-sm text-muted">
            {resultCount === 0
              ? 'No questions matched.'
              : `${resultCount} ${resultCount === 1 ? 'question' : 'questions'} matched “${query.trim()}”.`}
          </p>
        )}

        {groups.length === 0 ? (
          <EmptyState
            icon="search"
            title="Nothing here answers that"
            description="Try a shorter search, or ask us directly — a question nobody can find the answer to is our problem, not yours."
          />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-14">
            {/* Jump list. Hidden on small screens, where scrolling is faster than a rail. */}
            <nav className="hidden lg:block" aria-label="FAQ categories">
              <div className="sticky top-20">
                <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
                  Categories
                </p>
                <ul className="mt-3 space-y-0.5">
                  {groups.map((group) => (
                    <li key={group.id}>
                      <a
                        href={`#${group.id}`}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-subtle hover:text-brand"
                      >
                        <Icon name={group.icon} className="h-4 w-4 shrink-0 text-brand" />
                        {group.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="min-w-0">
              {groups.map((group) => (
                <section key={group.id} id={group.id} className="mb-11 scroll-mt-20 last:mb-0">
                  <h2 className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-faint">
                    <Icon name={group.icon} className="h-4 w-4 text-brand" />
                    {group.label}
                    <span className="h-px flex-1 bg-line" />
                  </h2>

                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {group.faqs.map((faq) => (
                      <li key={faq.id}>
                        <details id={faq.id} className="group scroll-mt-20">
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-left text-sm font-semibold text-fg transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
                            {faq.question}
                            <Icon
                              name="chevronDown"
                              className="mt-0.5 h-4 w-4 shrink-0 text-faint transition-transform duration-200 group-open:-rotate-180"
                            />
                          </summary>
                          <p className="max-w-2xl pb-5 pr-8 text-sm leading-relaxed text-muted">
                            {faq.answer}
                          </p>
                        </details>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------ still stuck */}
      <section className="border-t border-line bg-surface py-14">
        <div className="container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Still not answered?</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              The fastest answer to “which level am I?” is the placement test — it is free and
              takes six minutes. For anything else, ask us.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button to="/placement-test">
              <Icon name="target" className="h-4 w-4" />
              Take the free test
            </Button>
            <Button to="/languages" variant="outline">
              Browse languages
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
