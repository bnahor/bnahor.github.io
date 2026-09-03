import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { ContactTile } from './components/ContactTile';
import { OutcomeRail } from './components/OutcomeRail';
import { SiteHeader } from './components/SiteHeader';
import { EducationTile } from './components/tiles/EducationTile';
import { ExperienceTile } from './components/tiles/ExperienceTile';
import { HeroTile } from './components/tiles/HeroTile';
import { LearnTile } from './components/tiles/LearnTile';
import { ProjectsTile } from './components/tiles/ProjectsTile';
import { profile } from './data/profile';

// The shelf is a separate route (#!/shelf) and its own chunk — it only
// downloads when visited.
const ShelfView = lazy(() => import('./learn/ShelfView'));

/** Hash-based routing: #/shelf serves the learning log, everything else is
 *  a same-page anchor on the portfolio (so #experience etc. keep working). */
function useShelfRoute() {
  const [onShelf, setOnShelf] = useState(() => window.location.hash.startsWith('#/shelf'));

  useEffect(() => {
    const onChange = () => setOnShelf(window.location.hash.startsWith('#/shelf'));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return onShelf;
}

export default function App() {
  const onShelf = useShelfRoute();
  const wasOnShelf = useRef(onShelf);

  // Returning from the shelf to a section anchor: the homepage mounts fresh,
  // so the browser' default hash scroll has nothing to land on. Do it manually.
  useEffect(() => {
    if (wasOnShelf.current && !onShelf) {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView();
    }
    wasOnShelf.current = onShelf;
  }, [onShelf]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {onShelf ? (
          <Suspense
            fallback={
              <div className="site-shell">
                <main className="site-main shelf-main">
                  <p className="shelf-fallback">Opening the shelf…</p>
                </main>
              </div>
            }
          >
            <ShelfView />
          </Suspense>
        ) : (
          <div className="site-shell">
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>

            <div className="time-grid" aria-hidden="true" />

            <SiteHeader />

            <main id="main-content" className="site-main">
              <HeroTile />
              <OutcomeRail />
              <LearnTile />
              <ExperienceTile />
              <ProjectsTile />

              <div className="closing-grid">
                <EducationTile />
                <ContactTile />
              </div>
            </main>

            <footer className="site-footer">
              <p>
                © {new Date().getFullYear()} {profile.name}
              </p>
              <p>Designed and built in Singapore.</p>
            </footer>
          </div>
        )}
      </MotionConfig>
    </LazyMotion>
  );
}
