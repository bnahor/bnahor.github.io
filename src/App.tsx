import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ContactTile } from './components/ContactTile';
import { SiteHeader } from './components/SiteHeader';
import { Stage } from './components/stage/Stage';
import { EducationTile } from './components/tiles/EducationTile';
import { ExperienceTile } from './components/tiles/ExperienceTile';
import { HeroTile } from './components/tiles/HeroTile';
import { ProjectsTile } from './components/tiles/ProjectsTile';
import { ScenesTile } from './components/tiles/ScenesTile';
import { SkillsTile } from './components/tiles/SkillsTile';
import { WritingTile } from './components/tiles/WritingTile';
import { profile } from './data/profile';
import { useElastic, useReveal } from './lib/motion';

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
  const wasOnPage = useRef(true);

  useReveal('.reel-section, .fin, .reel-footer, .scene-copy', route);
  useElastic('.home-main, .page-main, .page-footer');

  // Arriving at a section anchor, from a page or a direct link: the homepage
  // mounts fresh, so the browser's default hash scroll has nothing to land on.
  // Do it manually.
  useEffect(() => {
    if (wasOnPage.current && !onPage) {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView();
    }
    wasOnPage.current = onPage;
  }, [onPage]);

  return (
    <div key={route} className="route">
      {onPage ? (
        <Suspense
          fallback={
            <div className="page">
              <main className="page-main">
                <p className="page-note">Opening the {PAGE_NAMES[route]}…</p>
              </main>
            </div>
          }
        >
          {route === 'library' ? <LibraryView /> : route === 'blog' ? <BlogView /> : <ShelfView />}
        </Suspense>
      ) : (
        <div className="home">
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>

          <Stage />
          <SiteHeader />

          <main id="main-content" className="home-main">
            <div id="stage-sections">
              <HeroTile />
              <ScenesTile />
            </div>

            <div id="end-reel" className="reel">
              <ExperienceTile />
              <ProjectsTile />
              <SkillsTile />
              <EducationTile />
              <WritingTile />
              <ContactTile />

              <footer className="reel-footer">
                <p>
                  © {new Date().getFullYear()} {profile.name}. Designed and built in Singapore.
                </p>
                <p>
                  Motion from{' '}
                  <a href="https://www.ianxmason.com/100style/" target="_blank" rel="noreferrer">
                    The 100STYLE Dataset
                  </a>{' '}
                  by Ian Mason,{' '}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 4.0
                  </a>
                  . Cut to single strides, rebuilt on neutral proportions and smoothed.
                </p>
              </footer>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
