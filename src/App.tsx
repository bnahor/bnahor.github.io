import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { CommandPalette } from './components/layout/CommandPalette';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ContactProvider } from './components/ContactProvider';
import { BlogPage, BlogPostPage, CaseStudyPage, HomePage, NotFoundPage } from './pages';
import { smooth } from './utils/motionPresets';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={smooth}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/case-studies/:slug" element={<CaseStudyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </m.div>
    </AnimatePresence>
  );
}

function AppFrame() {
  return (
    <div className="app-bg min-h-screen text-text-primary pb-[env(safe-area-inset-bottom)]">
      <div className="app-glow-layer" aria-hidden="true" />

      <ContactProvider>
        <div className="relative z-10">
          <Header />

          <main>
            <AnimatedRoutes />
          </main>

          <Footer />
        </div>

        <CommandPalette />
      </ContactProvider>
      <ScrollToTop />
    </div>
  );
}

export default function App() {
  const basename = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL;

  return (
    <BrowserRouter basename={basename}>
      <LazyMotion features={domAnimation}>
        <AppFrame />
      </LazyMotion>
    </BrowserRouter>
  );
}
