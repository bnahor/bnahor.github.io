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

// Both learning routes are their own chunks — neither downloads until
// visited, and the library catalogue in particular is a large payload.
const ShelfView = lazy(() => import('./learn/ShelfView'));
const LibraryView = lazy(() => import('./learn/LibraryView'));

type Route = 'home' | 'shelf' | 'library';

function readRoute(): Route {
  const hash = window.location.hash;
  if (hash.startsWith('#/shelf')) return 'shelf';
  if (hash.startsWith('#/library')) return 'library';
  return 'home';
}

/** Hash-based routing: #/shelf and #/library are pages, everything else is a
 *  same-page anchor on the portfolio (so #experience etc. keep working). */
function useRoute(): Route {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export default function App() {
  const route = useRoute();
  const onPage = route !== 'home';
  const wasOnPage = useRef(onPage);

  // Returning from a page to a section anchor: the homepage mounts fresh, so
  // the browser's default hash scroll has nothing to land on. Do it manually.
  useEffect(() => {
    if (wasOnPage.current && !onPage) {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView();
    }
    wasOnPage.current = onPage;
  }, [onPage]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {onPage ? (
          <Suspense
            fallback={
              <div className="site-shell">
                <main className="site-main shelf-main">
                  <p className="shelf-fallback">
                    Opening the {route === 'library' ? 'library' : 'shelf'}…
                  </p>
                </main>
              </div>
            }
          >
            {route === 'library' ? <LibraryView /> : <ShelfView />}
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
