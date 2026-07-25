import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { getBlogIndex, loadPostBySlug } from '../utils/blog';
import type { BlogPostMeta } from '../types/content';
import { ScrollReveal, StaggerGroup } from '../utils/motion';
import { fadeUp, slow, smooth } from '../utils/motionPresets';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostMeta | null>(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await loadPostBySlug(slug);

      if (!cancelled) {
        setPost(result?.post ?? null);
        setHtml(result?.html ?? '');
        setLoading(false);
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const relatedPosts = useMemo(() => {
    const posts = getBlogIndex().posts;
    if (!post) return posts.slice(0, 3);
    return posts.filter((candidate) => candidate.slug !== post.slug).slice(0, 3);
  }, [post]);

  if (loading) {
    return (
      <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
        <div className="panel p-6 text-sm text-text-muted">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
        <div className="space-y-4">
          <div className="panel p-6 text-sm text-text-muted">
            This post could not be found.
          </div>
          <Link to="/blog" className="text-sm text-brand/80 transition hover:text-brand">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="border-b border-line pb-8 lg:border-b-0">
          <Link to="/blog" className="group inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-brand/60 transition hover:text-brand">
            <m.span className="inline-block" whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>&larr;</m.span>
            Back to blog
          </Link>

          <m.h1
            variants={fadeUp()}
            initial="hidden"
            animate="visible"
            transition={slow}
            className="mt-4 font-display text-3xl leading-tight text-text-primary md:text-4xl"
          >
            {post.title}
          </m.h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
            <span>{formatDate(post.date)}</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>

          <StaggerGroup className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag, index) => (
              <ScrollReveal key={tag} delay={index * 0.06}>
                <span className="rounded-md border border-brand/15 bg-brand/5 px-2 py-0.5 text-[11px] text-brand/70">
                  {tag}
                </span>
              </ScrollReveal>
            ))}
          </StaggerGroup>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...smooth, delay: 0.3 }}
            className="prose-shell mt-8"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>

        <aside className="space-y-3">
          <section className="panel p-4">
            <h2 className="font-display text-lg text-text-primary">Related Notes</h2>
            <ul className="mt-3 space-y-2">
              {relatedPosts.map((related) => (
                <li key={related.slug}>
                  <Link
                    to={`/blog/${related.slug}`}
                    className="group inline-flex items-center gap-1 text-sm text-text-muted transition hover:text-brand"
                  >
                    {related.title}
                    <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
