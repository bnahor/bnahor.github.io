import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroTile } from '../components/tiles/HeroTile';
import { ProjectsTile } from '../components/tiles/ProjectsTile';
import { ExperienceTile } from '../components/tiles/ExperienceTile';
import { EducationTile } from '../components/tiles/EducationTile';
import { TimelineTile } from '../components/tiles/TimelineTile';
import { OpenSourceActivity } from '../components/open-source/OpenSourceActivity';
import { NowNotesTile } from '../components/tiles/NowNotesTile';
import { LatestThoughts } from '../components/blog/LatestThoughts';
import { NowBuildingTile } from '../components/tiles/NowBuildingTile';
import { ScrollReveal } from '../utils/motion';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section');
    if (!section) return;

    const timeout = window.setTimeout(() => {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setSearchParams((current: URLSearchParams) => {
        const next = new URLSearchParams(current);
        next.delete('section');
        return next;
      });
    }, 120);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchParams, setSearchParams]);

  return (
    <div>
      {/* Hero — full bleed, no container */}
      <HeroTile />

      {/* Content area */}
      <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] space-y-16 py-14 md:w-[min(1120px,calc(100%-3rem))] md:space-y-20 md:py-18">
        {/* Projects — bento grid */}
        <ScrollReveal>
          <section id="projects">
            <ProjectsTile />
          </section>
        </ScrollReveal>

        {/* Open Source */}
        <OpenSourceActivity />

        {/* Experience + Education — side by side */}
        <ScrollReveal>
          <div id="experience" className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <ExperienceTile />
            <EducationTile />
          </div>
        </ScrollReveal>

        {/* Blog */}
        <LatestThoughts />

        {/* Timeline + Now Building + Now Notes */}
        <ScrollReveal>
          <div id="timeline" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-10">
              <TimelineTile isExpanded={false} />
            </div>
            <div className="space-y-10">
              <NowNotesTile />
              <NowBuildingTile />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
