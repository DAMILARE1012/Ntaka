import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import PartnerLogo from '@/components/common/PartnerLogo';
import Seo from '@/components/common/Seo';
import { PageHeader } from '@/components/layout/PageLayout';
import { STATIC_SEO } from '@/lib/seo';
import { graph, collectionPage, breadcrumbs } from '@/lib/structuredData';
import { PARTNERS, partnersByKind } from '@/services/mock/partners';

const WHY = [
  {
    icon: 'globe',
    title: 'Languages outlive platforms',
    body: 'The people who have kept these languages spoken for generations know more about teaching them than any product team does.',
  },
  {
    icon: 'certificate',
    title: 'Standards that travel',
    body: 'Working with cultural and education bodies is how a level earned here comes to mean something outside here.',
  },
  {
    icon: 'users',
    title: 'Teachers, found properly',
    body: 'Community associations are how we reach native speakers who would never answer a job advert.',
  },
];

export default function PartnersPage() {
  const groups = partnersByKind();

  return (
    <>
      <Seo
        {...STATIC_SEO.partners}
        jsonLd={graph(
          collectionPage({ ...STATIC_SEO.partners, itemType: 'Partner organisations' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Partners', path: '/partners' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Partners"
        title="Who we work with"
        description="Ntaka is built alongside the cultural bodies, community associations and educators who keep African languages spoken."
      />

      {/* ------------------------------------------------------------ partners */}
      <div className="container py-12">
        {groups.map((group) => (
          <section key={group.kind} className="mb-12 last:mb-0">
            <h2 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-faint">
              {group.label}
              <span className="h-px flex-1 bg-line" />
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">{group.description}</p>

            <ul className="mt-6 grid gap-5 lg:grid-cols-2">
              {group.partners.map((partner) => (
                <li
                  key={partner.id}
                  className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 sm:flex-row"
                >
                  <PartnerLogo partner={partner} size="lg" />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{partner.country}</Badge>
                      {partner.shortName && partner.shortName !== partner.name && (
                        <span className="text-2xs font-semibold uppercase tracking-wide text-faint">
                          {partner.shortName}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-fg">
                      {partner.name}
                    </h3>

                    {partner.motto && (
                      <p className="mt-1 font-display text-sm italic text-brand">
                        {partner.motto}
                      </p>
                    )}

                    <p className="mt-2 text-sm leading-relaxed text-muted">{partner.blurb}</p>

                    {partner.url && (
                      <a
                        href={partner.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-arrow mt-3 inline-flex"
                      >
                        Visit website
                        <Icon name="arrowRight" className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ----------------------------------------------------------------- why */}
      <section className="border-t border-line bg-surface py-14">
        <div className="container">
          <h2 className="text-xl font-semibold sm:text-2xl">Why we partner</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {WHY.map((item) => (
              <div key={item.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-md font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ become one */}
      <section className="container py-14">
        <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-7 py-12 text-white sm:px-12">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-leaf-500/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.14em] text-leaf-200">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Work with us
            </p>
            <h2 className="mt-4 text-balance font-display text-2xl font-semibold sm:text-3xl">
              Does your organisation work on an African language?
            </h2>
            <p className="mt-3 text-ink-200">
              We are looking for cultural associations, universities and ministries who want their
              language taught properly online — and who can help us find the teachers to do it.
            </p>
            <Button variant="light" size="lg" className="mt-7">
              Get in touch
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
