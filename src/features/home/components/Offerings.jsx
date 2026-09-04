import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { SectionHeading } from '@/components/ui/States';

const OFFERINGS = [
  {
    to: '/teachers',
    icon: 'user',
    label: '1-on-1 lessons',
    tone: 'from-leaf-500 to-leaf-700',
    body: 'A native teacher, one on one. Rating, rate and open hours up front.',
    points: ['Cheap trial lesson', 'Live 7-day availability', 'A plan built round your goal'],
    cta: 'Find my teacher',
  },
  {
    to: '/classes',
    icon: 'users',
    label: 'Group classes',
    tone: 'from-leaf-700 to-ink-900',
    body: 'Fixed level, fixed topic, and everybody speaks.',
    points: ['4 to 10 learners', 'One-off or weekly series', 'From $4 a seat'],
    cta: 'View all classes',
  },
  {
    to: '/interactive-learning',
    icon: 'video',
    label: 'Interactive learning',
    tone: 'from-leaf-400 to-leaf-600',
    body: 'Recorded by our teachers. Watch, repeat, keep forever.',
    points: ['On demand, lifetime access', 'Phrase sheets and quizzes', 'Free courses in every language'],
    cta: 'Browse courses',
  },
];

/** The three ways to learn on Ntaka. */
export default function Offerings() {
  return (
    <section className="bg-surface py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="Three ways to learn"
          title="Live, together, or at your own pace"
          description="A 1-on-1 to be corrected. A group class to be brave in. Videos for the gaps between."
          align="center"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {OFFERINGS.map((offering) => (
            <Link
              key={offering.to}
              to={offering.to}
              className="group flex flex-col rounded-3xl border border-line bg-subtle/50 p-7 transition-all duration-200 hover:-translate-y-1 hover:border-line-strong hover:bg-surface hover:shadow-lift"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${offering.tone} text-white shadow-sm`}
              >
                <Icon name={offering.icon} className="h-6 w-6" />
              </span>

              <h3 className="mt-5 font-display text-xl font-semibold">{offering.label}</h3>
              <p className="mt-2.5 text-md leading-relaxed text-muted">{offering.body}</p>

              <ul className="mt-5 space-y-2">
                {offering.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-fg">
                    <Icon
                      name="check"
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      strokeWidth={2.5}
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <span className="link-arrow mt-6">
                {offering.cta}
                <Icon
                  name="arrowRight"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
