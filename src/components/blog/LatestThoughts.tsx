import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { getLatestPosts } from '../../utils/blog';
import { StaggerGroup, ScrollReveal } from '../../utils/motion';
import { tapScale } from '../../utils/motionPresets';

function readableDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function LatestThoughts() {
  const posts = getLatestPosts(3);

  return (
    <ScrollReveal>
      <section id="latest-thoughts" aria-labelledby="latest-thoughts-heading">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Writing</p>
            <h2 id="latest-thoughts-heading" className="section-title">
              Engineering notes
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-sm text-text-muted transition hover:text-brand"
          >
            View all
          </Link>
        </div>

        <StaggerGroup className="grid gap-4 md:grid-cols-3">
          {posts.map((post, index) => (
            <ScrollReveal key={post.slug} delay={index * 0.08}>
              <m.article
                whileHover={{ y: -3 }}
                whileTap={tapScale}
                className="panel group p-5 transition-colors hover:border-brand/30"
              >
                <p className="font-mono text-[11px] text-text-muted">{readableDate(post.date)}</p>
                <h3 className="mt-2 font-display text-lg text-text-primary">{post.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{post.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-md border border-brand/15 bg-brand/5 px-2 py-0.5 text-[11px] text-brand/70">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand/80 transition group-hover:text-brand"
                >
                  Read note
                </Link>
              </m.article>
            </ScrollReveal>
          ))}
        </StaggerGroup>
      </section>
    </ScrollReveal>
  );
}
