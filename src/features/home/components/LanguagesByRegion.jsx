import { Link } from 'react-router-dom';
import { useGetLanguagesByCountryQuery } from '@/services/api';
import { SectionHeading } from '@/components/ui/States';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { REGIONS } from '@/services/mock/catalog';
import Flag from '@/components/common/Flag';

/** Countries grouped by region, each listing its major languages. */
export default function LanguagesByRegion() {
  const { data, isLoading } = useGetLanguagesByCountryQuery();

  return (
    <section className="bg-surface py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="The catalogue"
          title="Major languages, country by country"
          description="The languages most spoken across Africa's biggest markets."
          action={
            <Button to="/languages" variant="outline">
              All languages
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          }
        />

        {isLoading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {REGIONS.map((region) => {
              const countries = (data ?? []).filter((c) => c.region === region);
              if (!countries.length) return null;

              return (
                <div key={region}>
                  <h3 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-faint">
                    {region}
                    <span className="h-px flex-1 bg-line" />
                  </h3>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {countries.map((country) => (
                      <div
                        key={country.id}
                        className="rounded-2xl border border-line bg-subtle/50 p-5"
                      >
                        <p className="flex items-center gap-2.5 font-display font-semibold text-fg">
                          <Flag iso={country.iso} size="sm" />
                          {country.name}
                        </p>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {country.languages.map((language) => (
                            <li key={language.id}>
                              <Link
                                to={`/languages/${language.id}`}
                                className="inline-block rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-fg transition-colors hover:border-brand-border hover:text-brand"
                              >
                                {language.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
