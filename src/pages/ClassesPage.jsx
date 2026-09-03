import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageLayout';
import ClassFilters from '@/features/classes/components/ClassFilters';
import ClassList from '@/features/classes/components/ClassList';
import { useAppDispatch } from '@/app/hooks';
import { setFilter } from '@/features/classes/classesSlice';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';
import { graph, collectionPage, breadcrumbs } from '@/lib/structuredData';

export default function ClassesPage() {
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const languageParam = params.get('language') ?? '';

  useEffect(() => {
    if (languageParam) dispatch(setFilter({ key: 'languageId', value: languageParam }));
  }, [languageParam, dispatch]);

  return (
    <>
      <Seo
        {...STATIC_SEO.classes}
        jsonLd={graph(
          collectionPage({ ...STATIC_SEO.classes, itemType: 'Live language classes' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Group classes', path: '/classes' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Group classes"
        title="Learn with other people"
        description="Small, scheduled classes led by Ntaka teachers. Fixed level, fixed topic, four to ten learners — and everybody speaks."
      />

      <div className="container space-y-8 py-10">
        <ClassFilters />
        <ClassList />
      </div>
    </>
  );
}
