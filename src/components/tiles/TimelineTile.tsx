import { m } from 'framer-motion';
import { experience } from '../../data/experience';
import { education } from '../../data/education';
import { highlights } from '../../data/highlights';
import { Icon } from '../Icon';
import { useMemo } from 'react';
import { fadeUp } from '../../utils/motionPresets';

type TimelineIcon = 'briefcase' | 'education' | 'trophy';

interface TimelineEvent {
  type: 'experience' | 'education' | 'achievement';
  title: string;
  subtitle: string;
  date: string;
  endDate?: string | null;
  description?: string;
  icon: TimelineIcon;
}

function createTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  experience.forEach(exp => {
    events.push({
      type: 'experience',
      title: exp.role,
      subtitle: exp.company,
      date: exp.start,
      endDate: exp.end,
      description: exp.bullets?.[0] || '',
      icon: 'briefcase',
    });
  });

  education.forEach(edu => {
    events.push({
      type: 'education',
      title: edu.degree,
      subtitle: edu.school,
      date: edu.start,
      endDate: edu.end,
      description: edu.details?.[0] || '',
      icon: 'education',
    });
  });

  highlights.forEach(highlight => {
    events.push({
      type: 'achievement',
      title: highlight.title,
      subtitle: '',
      date: highlight.date,
      description: highlight.note || '',
      icon: 'trophy',
    });
  });

  return events.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
}

interface TimelineTileProps {
  isExpanded: boolean;
}

export function TimelineTile({ isExpanded }: TimelineTileProps) {
  const timeline = createTimeline();
  const displayEvents = isExpanded ? timeline : timeline.slice(0, 6);

  const groups = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const ev of displayEvents) {
      const y = new Date(ev.date).getFullYear().toString();
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(ev);
    }
    for (const [y, arr] of map) {
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      map.set(y, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => parseInt(b) - parseInt(a));
  }, [displayEvents]);

  const dotColor = (type: string) => {
    switch (type) {
      case 'experience': return 'bg-brand';
      case 'education': return 'bg-accent';
      case 'achievement': return 'bg-highlight';
      default: return 'bg-brand';
    }
  };

  return (
    <section>
      <p className="section-kicker">Timeline</p>
      <h2 className="mt-1 font-display text-2xl text-text-primary">
        Career timeline
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        {isExpanded
          ? 'Complete journey of education, experience, and achievements'
          : 'Recent milestones and career highlights'
        }
      </p>

      <div className="mt-6 space-y-6">
        {groups.map(([year, items]) => (
          <div key={year} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tracking-wider text-text-muted">{year}</span>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="space-y-2">
              {items.map((event, idx) => (
                <m.div
                  key={`${event.type}-${event.title}-${idx}`}
                  variants={fadeUp(idx * 0.06)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-40px' }}
                  className="flex gap-3 py-2"
                >
                  <div className="flex flex-col items-center pt-1.5">
                    <span className={`h-2.5 w-2.5 ${dotColor(event.type)}`} />
                    <div className="mt-1 w-px flex-1 bg-line" />
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded text-text-muted">
                        <Icon name={event.icon} size={12} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-snug">{event.title}</p>
                        {event.subtitle && event.type !== 'achievement' && (
                          <p className="text-xs text-brand/70">{event.subtitle}</p>
                        )}
                        <p className="font-mono text-[11px] text-text-muted mt-0.5">
                          {event.date}{event.endDate && ` — ${event.endDate}`}
                        </p>
                        {event.description && (
                          <p className="text-xs text-text-muted leading-relaxed mt-1">
                            {!isExpanded && event.description.length > 120
                              ? `${event.description.substring(0, 120)}...`
                              : event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-6 border-t border-line pt-4">
        <div>
          <p className="text-lg font-bold text-text-primary">{experience.length}</p>
          <p className="text-xs text-text-muted">Roles</p>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{education.length}</p>
          <p className="text-xs text-text-muted">Degrees</p>
        </div>
        <div>
          <p className="text-lg font-bold text-text-primary">{highlights.length}</p>
          <p className="text-xs text-text-muted">Achievements</p>
        </div>
      </div>
    </section>
  );
}
