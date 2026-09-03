import { useState } from 'react';
import { useGetTeachersQuery } from '@/services/api';
import { SectionHeading } from '@/components/ui/States';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import TeacherCard from '@/features/teachers/components/TeacherCard';
import { LANGUAGES_FULL } from '@/services/mock/catalog';
import { cx } from '@/lib/format';
import Flag from '@/components/common/Flag';

const TABS = LANGUAGES_FULL.filter((l) => l.featured).slice(0, 6);

/** Homepage rail of top-rated teachers, filterable by language. */
export default function FeaturedTeachers() {
  const [languageId, setLanguageId] = useState(TABS[0]?.id ?? '');
  const { data, isFetching } = useGetTeachersQuery({
    languageId,
    sort: 'recommended',
    pageSize: 2,
  });

  return (
    <section className="py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="1-on-1 lessons"
          title="Meet the teachers"
          description="Rating, rate and open hours up front. Try one before you commit."
          action={
            <Button to="/teachers" variant="outline">
              See all teachers
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
          }
        />

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar" role="tablist">
          {TABS.map((language) => (
            <button
              key={language.id}
              type="button"
              role="tab"
              aria-selected={languageId === language.id}
              onClick={() => setLanguageId(language.id)}
              className={cx(
                'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                languageId === language.id
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-line-strong bg-surface text-fg hover:border-line-strong',
              )}
            >
              <Flag iso={language.iso} size="xs" />
              {language.name}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {isFetching && !data ? (
            <SkeletonGrid count={2} className="lg:grid-cols-1" />
          ) : (
            <div className="space-y-5">
              {data?.items.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
