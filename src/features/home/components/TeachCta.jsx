import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

const REASONS = [
  { icon: 'calendar', text: 'Your hours, your rate' },
  { icon: 'users', text: 'Teach live or record a course' },
  { icon: 'certificate', text: 'Keep most of what you earn' },
];

export default function TeachCta() {
  return (
    <section className="container pb-4 pt-14 md:pt-16">
      <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-7 py-12 text-white sm:px-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-200">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Teach on Ntaka
            </p>
            <h2 className="mt-4 text-balance font-display text-2xl font-semibold sm:text-3xl">
              Your language is worth teaching.
            </h2>
            <p className="mt-3 max-w-md text-ink-200">
              African languages have been under-served online for too long. Speak one natively? We
              will help you build a class.
            </p>

            <ul className="mt-7 space-y-3">
              {REASONS.map((reason) => (
                <li key={reason.text} className="flex items-center gap-3 text-sm text-ink-200">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon name={reason.icon} className="h-4 w-4" />
                  </span>
                  {reason.text}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="light" size="lg">
                Become a teacher
              </Button>
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                How it works
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <p className="font-display text-sm font-semibold uppercase tracking-wider text-gold-200">
              What we are looking for
            </p>
            <ul className="mt-4 space-y-3 text-sm text-ink-200">
              {[
                'Native or near-native fluency',
                'A quiet space and a stable connection',
                'Patience with beginners',
                'Experience welcome, not required',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon
                    name="check"
                    className="mt-0.5 h-4 w-4 shrink-0 text-leaf-300"
                    strokeWidth={2.5}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
