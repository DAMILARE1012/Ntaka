import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetLanguagesQuery } from '@/services/api';
import { PageHeader } from '@/components/layout/PageLayout';
import { SearchInput } from '@/components/ui/Field';
import { FilterPill } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import LanguageCard from '@/features/languages/components/LanguageCard';
import { REGIONS } from '@/services/mock/catalog';
import { useDebounced } from '@/app/hooks';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';
import { graph, collectionPage, breadcrumbs } from '@/lib/structuredData';

/** Two rows of three, then paginate - same rhythm as the classes and courses grids. */
const PAGE_SIZE = 6;

export default function LanguagesPage() {
  // The search term lives in the URL so a query is linkable, and so the SearchAction
  // declared in the site's structured data points at something that actually works.
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [region, setRegion] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(query, 250);

  const setQuery = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next, { replace: true });
  };

  const { data, isFetching } = useGetLanguagesQuery({ q: debounced, region });

  // The catalogue is small enough to filter server-side and page in the component; the
  // same endpoint feeds the homepage rail, which wants the whole list in one array.
  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visible = useMemo(
    () => (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [data, page],
  );

  // A narrowed result set can be shorter than the page you were on.
  useEffect(() => setPage(1), [debounced, region]);

  return (
    <>
      <Seo
        {...STATIC_SEO.languages}
        jsonLd={graph(
          collectionPage({ ...STATIC_SEO.languages, itemType: 'African languages' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Languages', path: '/languages' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="The catalogue"
        title="African languages on Ntaka"
        description="We start with the languages most spoken across Africa's largest markets, taught by people who grew up speaking them. More are added every month."
      >
        <div className="mt-8 flex flex-col gap-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search a language or a country"
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <FilterPill active={!region} onClick={() => setRegion('')}>
              All regions
            </FilterPill>
            {REGIONS.map((r) => (
              <FilterPill key={r} active={region === r} onClick={() => setRegion(r)}>
                {r}
              </FilterPill>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="container py-10">
        {isFetching && !data ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : data?.length ? (
          <>
            <p className="mb-5 text-sm text-muted">
              <span className="font-semibold text-fg">{total}</span> languages
              {region && ` in ${region}`}
              {totalPages > 1 && ` · page ${page} of ${totalPages}`}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((language) => (
                <LanguageCard key={language.id} language={language} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-10" />
          </>
        ) : (
          <EmptyState
            icon="globe"
            title="No language matches that search"
            description="Try a country name, or clear the region filter."
            actionLabel="Clear search"
            onAction={() => {
              setQuery('');
              setRegion('');
            }}
          />
        )}
      </div>
    </>
  );
}
