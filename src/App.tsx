import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion';
import { ContactTile } from './components/ContactTile';
import { OutcomeRail } from './components/OutcomeRail';
import { SiteHeader } from './components/SiteHeader';
import { EducationTile } from './components/tiles/EducationTile';
import { ExperienceTile } from './components/tiles/ExperienceTile';
import { HeroTile } from './components/tiles/HeroTile';
import { LearnTile } from './components/tiles/LearnTile';
import { ProjectsTile } from './components/tiles/ProjectsTile';
import { WritingTile } from './components/tiles/WritingTile';
import { Reveal } from './components/motion/Reveal';
import { profile } from './data/profile';

// Each routed page is its own chunk — none downloads until visited, and the
// library catalogue in particular is a large payload.
const ShelfView = lazy(() => import('./learn/ShelfView'));
const LibraryView = lazy(() => import('./learn/LibraryView'));
const BlogView = lazy(() => import('./blog/BlogView'));

type Route = 'home' | 'shelf' | 'library' | 'blog';

const PAGE_NAMES: Record<Exclude<Route, 'home'>, string> = {
  shelf: 'shelf',
  library: 'library',
  blog: 'blog',
};

function readRoute(): Route {
  const hash = window.location.hash;
  if (hash.startsWith('#/shelf')) return 'shelf';
  if (hash.startsWith('#/library')) return 'library';
  if (hash.startsWith('#/blog')) return 'blog';
  return 'home';
}

/** Hash-based routing: #/shelf, #/library and #/blog are pages, everything else is a
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
        {/* Keyed on the route so moving between pages fades rather than cuts.
            Opacity only: a transform here would break the sticky header. */}
        <m.div
          key={route}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {onPage ? (
            <Suspense
              fallback={
                <div className="site-shell">
                  <main className="site-main shelf-main">
                    <p className="shelf-fallback">Opening the {PAGE_NAMES[route]}…</p>
                  </main>
                </div>
              }
            >
              {route === 'library' ? (
                <LibraryView />
              ) : route === 'blog' ? (
                <BlogView />
              ) : (
                <ShelfView />
              )}
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
                <WritingTile />
                <LearnTile />
                <ExperienceTile />
                <ProjectsTile />

                <Reveal className="closing-grid">
                  <EducationTile />
                  <ContactTile />
                </Reveal>
              </main>

              <footer className="site-footer">
                <p>
                  © {new Date().getFullYear()} {profile.name}
                </p>
                <p>Designed and built in Singapore.</p>
              </footer>
            </div>
          )}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
