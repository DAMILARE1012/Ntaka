import Icon from '@/components/ui/Icon';
import Seo from '@/components/common/Seo';
import { PageHeader } from '@/components/layout/PageLayout';
import { STATIC_SEO } from '@/lib/seo';
import { graph, breadcrumbs, collectionPage } from '@/lib/structuredData';
import { LAST_UPDATED, SUBPROCESSORS, STORAGE_ITEMS } from '@/content/legal';

/**
 * One layout for privacy, terms and cookies.
 *
 * A legal page is read in two ways and has to serve both: skimmed by someone hunting for
 * one clause, and read through by someone deciding whether to trust you. So there is a
 * numbered contents list that jumps, and the body is plain prose in short sections rather
 * than a single wall of clauses.
 *
 * Two sections render as tables instead of prose — the sub-processor list and the browser
 * storage list. Those are the parts people actually check, and a table is honest in a way
 * a paragraph is not: it is obvious when a row is missing.
 */

const formatted = new Date(LAST_UPDATED).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function SubprocessorTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {['Provider', 'What they do', 'What they receive', 'Where'].map((heading) => (
              <th key={heading} className="pb-2.5 pr-4 text-2xs font-semibold uppercase tracking-wide text-faint">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {SUBPROCESSORS.map((provider) => (
            <tr key={provider.name} className="align-top">
              <td className="py-3 pr-4 font-semibold text-fg">{provider.name}</td>
              <td className="py-3 pr-4 text-muted">
                {provider.purpose}
                <span className="mt-1 block text-xs text-faint">{provider.note}</span>
              </td>
              <td className="py-3 pr-4 text-muted">{provider.data}</td>
              <td className="py-3 text-muted">{provider.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StorageTable() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {['Name', 'What it is for', 'How long', 'Essential'].map((heading) => (
              <th key={heading} className="pb-2.5 pr-4 text-2xs font-semibold uppercase tracking-wide text-faint">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {STORAGE_ITEMS.map((item) => (
            <tr key={item.key} className="align-top">
              <td className="py-3 pr-4">
                <code className="rounded bg-subtle px-1.5 py-0.5 text-xs text-fg">{item.key}</code>
                <span className="mt-1 block text-xs text-faint">{item.kind}</span>
              </td>
              <td className="py-3 pr-4 text-muted">{item.purpose}</td>
              <td className="py-3 pr-4 text-muted">{item.life}</td>
              <td className="py-3 text-muted">{item.essential ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LegalPage({ seoKey, eyebrow, title, intro, sections }) {
  const seo = STATIC_SEO[seoKey];

  return (
    <>
      <Seo
        {...seo}
        jsonLd={graph(
          collectionPage({ ...seo, itemType: 'Legal document' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: eyebrow, path: seo.path },
          ]),
        )}
      />

      <PageHeader eyebrow={eyebrow} title={title} description={intro}>
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-faint">
          <Icon name="clock" className="h-3.5 w-3.5" />
          Last updated {formatted}
        </p>
      </PageHeader>

      <div className="container py-12">
        <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
          <nav className="hidden lg:block" aria-label="Contents">
            <div className="sticky top-20">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
                Contents
              </p>
              <ol className="mt-3 space-y-0.5">
                {sections.map((section, i) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-subtle hover:text-brand"
                    >
                      <span className="nums shrink-0 text-faint">{i + 1}.</span>
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="min-w-0 max-w-3xl">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="mb-10 scroll-mt-20 last:mb-0">
                <h2 className="font-display text-lg font-semibold text-fg">
                  <span className="nums mr-2 text-faint">{i + 1}.</span>
                  {section.heading}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="mt-3 text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}

                {section.list && (
                  <ul className="mt-4 space-y-2.5">
                    {section.list.map((item) => (
                      <li key={item.slice(0, 32)} className="flex gap-3 text-sm leading-relaxed text-muted">
                        <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.subprocessors && <SubprocessorTable />}
                {section.storage && <StorageTable />}
              </section>
            ))}

            <p className="mt-12 border-t border-line pt-6 text-xs leading-relaxed text-faint">
              Something here unclear or wrong? Tell us — a policy nobody can understand is not
              doing its job.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
