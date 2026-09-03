import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageLayout';
import TeacherFilters from '@/features/teachers/components/TeacherFilters';
import TeacherList from '@/features/teachers/components/TeacherList';
import { useAppDispatch } from '@/app/hooks';
import { setFilter } from '@/features/teachers/teachersSlice';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';
import { graph, collectionPage, breadcrumbs } from '@/lib/structuredData';

/** 1-on-1 lesson marketplace. `?language=yoruba` deep-links from language pages. */
export default function TeachersPage() {
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const languageParam = params.get('language') ?? '';
  const levelParam = params.get('level') ?? '';

  useEffect(() => {
    if (languageParam) dispatch(setFilter({ key: 'languageId', value: languageParam }));
  }, [languageParam, dispatch]);

  useEffect(() => {
    if (levelParam) dispatch(setFilter({ key: 'level', value: levelParam }));
  }, [levelParam, dispatch]);

  return (
    <>
      <Seo
        {...STATIC_SEO.teachers}
        jsonLd={graph(
          collectionPage({ ...STATIC_SEO.teachers, itemType: 'Language teachers' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: '1-on-1 lessons', path: '/teachers' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="1-on-1 lessons"
        title="Find your teacher"
        description="Private lessons with native speakers of African languages. Compare ratings, rates and open hours, then book a trial."
      />

      <div className="container grid gap-8 py-10 lg:grid-cols-[300px_minmax(0,1fr)]">
        <TeacherFilters />
        <TeacherList />
      </div>
    </>
  );
}
