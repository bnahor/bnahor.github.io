import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { fadeUp, hoverLift, tapScale, smooth } from '../utils/motionPresets';

export function NotFoundPage() {
  return (
    <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
      <m.section
        variants={fadeUp()}
        initial="hidden"
        animate="visible"
        transition={smooth}
        className="panel p-8 text-center"
      >
        <p className="section-kicker">404</p>
        <h1 className="font-display text-3xl text-text-primary">Page not found</h1>
        <p className="mt-2 text-sm text-text-muted">The page you requested does not exist in this portfolio route set.</p>
        <div className="mt-5 flex justify-center gap-3">
          <m.div whileHover={hoverLift} whileTap={tapScale}>
            <Link
              to="/"
              className="inline-block rounded-md border border-line px-4 py-2 text-sm text-text-primary transition hover:border-brand/30 hover:text-brand"
            >
              Home
            </Link>
          </m.div>
          <m.div whileHover={hoverLift} whileTap={tapScale}>
            <Link
              to="/blog"
              className="inline-block rounded-md border border-line px-4 py-2 text-sm text-text-primary transition hover:border-brand/30 hover:text-brand"
            >
              Blog
            </Link>
          </m.div>
        </div>
      </m.section>
    </div>
  );
}
