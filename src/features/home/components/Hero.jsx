import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useGetPlatformStatsQuery } from '@/services/api';
import { formatCompact } from '@/lib/format';

/**
 * The greetings the poster used to have printed on it. They live here now so they can
 * follow the theme, be read by a screen reader, and be translated. Positions match the
 * empty zones the artwork leaves around the subject.
 */
const GREETINGS = [
  { hello: 'Sawubona', lang: 'Zulu', at: 'right-[2%] top-[8%]' },
  { hello: 'Hujambo', lang: 'Swahili', at: 'right-[-3%] top-[27%]' },
  { hello: 'Kedu', lang: 'Igbo', at: 'right-[1%] bottom-[16%]' },
  { hello: 'Molo', lang: 'Xhosa', at: 'left-[-4%] top-[45%]' },
  { hello: 'Kaabo', lang: 'Yoruba', at: 'left-[-2%] bottom-[14%]' },
];

const PROMISES = [
  'Free level test before you pay anything',
  'Native teachers across 14 countries',
  'Live lessons, group classes, video courses',
];

export default function Hero() {
  const { data: stats } = useGetPlatformStatsQuery();

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand/[0.07] blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-2xs font-semibold uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {stats
              ? `${stats.languages} languages · ${stats.countries} countries`
              : 'African languages, online'}
          </p>

          <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.1] lg:text-5xl">
            Speak the languages of{' '}
            <span className="relative whitespace-nowrap text-brand">
              Africa
              <svg
                className="absolute -bottom-1.5 left-0 h-2 w-full text-brand/35"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 6c40-4 90-5 196-2"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          <p className="mt-4 max-w-md text-lg text-muted">
            Taught by the people who grew up speaking them.
          </p>

          <ul className="mt-7 space-y-2.5">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-start gap-2.5 text-sm text-muted">
                <Icon
                  name="check"
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-brand"
                  strokeWidth={2.75}
                />
                {promise}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button to="/placement-test" size="lg">
              Take the free placement test
              <Icon name="arrowRight" className="h-4 w-4" />
            </Button>
            <Button to="/teachers" variant="outline" size="lg">
              Browse teachers
            </Button>
          </div>

          {stats && (
            <dl className="mt-10 flex flex-wrap gap-x-9 gap-y-4 border-t border-line pt-6">
              {[
                { label: 'Native teachers', value: formatCompact(stats.teachers) },
                { label: 'Lessons taught', value: formatCompact(stats.lessonsDelivered) },
                { label: 'Video courses', value: formatCompact(stats.courses) },
                { label: 'CEFR levels', value: '6' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dd className="nums font-display text-xl font-semibold text-fg">{stat.value}</dd>
                  <dt className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-faint">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* ---------------------------------------------------------- panel */}
        <div className="relative animate-scale-in">
          <img
            src="/hero-greeting-poster.webp"
            alt="A teacher waving hello during an online lesson, with a student joining from a laptop"
            width={1287}
            height={832}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            className="w-full"
          />

          {GREETINGS.map((greeting, i) => (
            <span
              key={greeting.hello}
              className={`absolute ${greeting.at} hidden animate-fade-up rounded-lg border border-line bg-surface px-2.5 py-1.5 shadow-lift sm:block`}
              style={{ animationDelay: `${160 + i * 90}ms` }}
            >
              <span className="font-display text-sm font-semibold leading-none text-fg">
                {greeting.hello}
              </span>
              <span className="ml-1.5 text-2xs font-medium text-muted">{greeting.lang}</span>
            </span>
          ))}

          <div className="absolute -bottom-3 left-[18%] hidden rounded-xl border border-line bg-surface px-4 py-3 shadow-lift lg:block">
            <p className="text-2xs font-medium uppercase tracking-wide text-faint">Your level</p>
            <p className="nums font-display text-xl font-semibold leading-tight text-brand">B1</p>
            <p className="text-2xs text-muted">Placed in 6 minutes, free</p>
          </div>
        </div>
      </div>
    </section>
  );
}
