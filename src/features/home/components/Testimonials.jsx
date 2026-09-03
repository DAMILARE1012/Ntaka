import Avatar from '@/components/ui/Avatar';
import { StarStrip } from '@/components/ui/Rating';
import LevelBadge from '@/components/common/LevelBadge';
import { SectionHeading } from '@/components/ui/States';

const STORIES = [
  {
    name: 'Chinelo A.',
    place: 'London, UK',
    language: 'Igbo',
    level: 'B1',
    quote:
      'I understood Igbo all my life but froze whenever I had to speak it. Nine months in, I called my grandmother.',
  },
  {
    name: 'Marcus O.',
    place: 'Atlanta, USA',
    language: 'Yorùbá',
    level: 'A2',
    quote:
      'Free check on Sunday, trial lesson on Tuesday. Seeing a teacher’s open hours before booking is why I started.',
  },
  {
    name: 'Amina S.',
    place: 'Nairobi, Kenya',
    language: 'Hausa',
    level: 'B2',
    quote:
      'Tourist phrases to running interviews in Kano — five months, one group class and a weekly 1-on-1.',
  },
];

export default function Testimonials() {
  return (
    <section className="py-14 md:py-16">
      <div className="container">
        <SectionHeading
          eyebrow="Learner stories"
          title="Where people actually get to"
          align="center"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {STORIES.map((story) => (
            <figure
              key={story.name}
              className="flex flex-col rounded-3xl border border-line bg-surface p-7 shadow-card"
            >
              <StarStrip value={5} />
              <blockquote className="mt-4 flex-1 text-md leading-relaxed text-fg">
                “{story.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3.5 border-t border-line pt-5">
                <Avatar name={story.name} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{story.name}</p>
                  <p className="text-xs text-muted">
                    {story.place} · {story.language}
                  </p>
                </div>
                <LevelBadge code={story.level} showName={false} className="ml-auto" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
