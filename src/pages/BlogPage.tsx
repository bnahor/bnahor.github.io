import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { getBlogIndex, getVisiblePosts } from '../utils/blog';
import { ScrollReveal, StaggerGroup } from '../utils/motion';
import { tapScale } from '../utils/motionPresets';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BlogPage() {
  const [activeTag, setActiveTag] = useState<string>('All');
  const [query, setQuery] = useState('');

  const index = getBlogIndex();
  const posts = getVisiblePosts();

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const tagPass = activeTag === 'All' || post.tags.includes(activeTag);
      const queryPass =
        !query.trim() ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.summary.toLowerCase().includes(query.toLowerCase());
      return tagPass && queryPass;
    });
  }, [activeTag, posts, query]);

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
      <div className="space-y-6">
        <ScrollReveal>
          <section className="border-b border-line pb-6">
            <p className="section-kicker">Blog</p>
            <h1 className="section-title">Engineering notes</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">
              Notes on platform engineering, shipping strategy, and reliability decisions from real project work.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <m.button
                type="button"
                whileTap={tapScale}
                onClick={() => setActiveTag('All')}
                className={`rounded-md border px-3 py-1 text-xs transition ${
                  activeTag === 'All'
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-white/20 text-text-muted hover:border-white/40 hover:text-text-primary'
                }`}
              >
                All
              </m.button>

              {index.tags.map((tag) => (
                <m.button
                  key={tag}
                  type="button"
                  whileTap={tapScale}
                  onClick={() => setActiveTag(tag)}
                  className={`rounded-md border px-3 py-1 text-xs transition ${
                    activeTag === tag
                      ? 'border-brand/40 bg-brand/10 text-brand'
                      : 'border-white/20 text-text-muted hover:border-white/40 hover:text-text-primary'
                  }`}
                >
                  {tag}
                </m.button>
              ))}
            </div>

            <div className="mt-4">
              <label htmlFor="blog-search" className="sr-only">
                Search blog posts
              </label>
              <input
                id="blog-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search thoughts..."
                className="w-full rounded-md border border-line bg-black/25 px-3 py-2 text-sm text-text-primary outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
              />
            </div>
          </section>
        </ScrollReveal>

        <StaggerGroup className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post, index) => (
            <ScrollReveal key={post.slug} delay={index * 0.08}>
              <m.article
                whileHover={{ y: -3 }}
                whileTap={tapScale}
                className="panel p-4 transition-colors hover:border-brand/30"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-brand/60">{formatDate(post.date)}</p>
                <h2 className="mt-2 font-display text-xl text-text-primary">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{post.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-md border border-brand/15 bg-brand/5 px-2 py-0.5 text-[11px] text-brand/70">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                  <span>{post.readingTimeMinutes} min read</span>
                  <Link to={`/blog/${post.slug}`} className="text-brand/80 transition hover:text-brand">
                    Read post
                  </Link>
                </div>
              </m.article>
            </ScrollReveal>
          ))}
        </StaggerGroup>

        {filteredPosts.length === 0 && (
          <div className="panel p-5 text-sm text-text-muted">
            No posts matched your filters.
          </div>
        )}
      </div>
    </div>
  );
}
