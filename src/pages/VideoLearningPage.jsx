import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageLayout';
import CourseFilters from '@/features/videos/components/CourseFilters';
import CourseList from '@/features/videos/components/CourseList';
import Icon from '@/components/ui/Icon';
import { useAppDispatch } from '@/app/hooks';
import { setFilter } from '@/features/videos/videosSlice';
import Seo from '@/components/common/Seo';
import { STATIC_SEO } from '@/lib/seo';
import { graph, collectionPage, breadcrumbs } from '@/lib/structuredData';

const BENEFITS = [
  { icon: 'headphones', title: 'Watch anywhere', body: 'Short lessons that fit a commute.' },
  { icon: 'book', title: 'Real syllabus', body: 'Modules, quizzes and phrase sheets.' },
  { icon: 'certificate', title: 'Yours for life', body: 'Buy once, revisit whenever.' },
];

export default function VideoLearningPage() {
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const languageParam = params.get('language') ?? '';

  useEffect(() => {
    if (languageParam) dispatch(setFilter({ key: 'languageId', value: languageParam }));
  }, [languageParam, dispatch]);

  return (
    <>
      <Seo
        {...STATIC_SEO.videoLearning}
        jsonLd={graph(
          collectionPage({ ...STATIC_SEO.videoLearning, itemType: 'Video courses' }),
          breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Video learning', path: '/video-learning' },
          ]),
        )}
      />

      <PageHeader
        eyebrow="Video learning"
        title="Self-paced video courses"
        description="Recorded by the same teachers who take live lessons. Work through a course on your own time, then bring your questions to a 1-on-1 or a group class."
      >
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon name={benefit.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-fg">{benefit.title}</p>
                <p className="text-sm text-muted">{benefit.body}</p>
              </div>
            </div>
          ))}
        </div>
      </PageHeader>

      <div className="container space-y-8 py-10">
        <CourseFilters />
        <CourseList />
      </div>
    </>
  );
}
