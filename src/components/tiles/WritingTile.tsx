import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Icon } from '../Icon';
import { EASE_OUT } from '../motion/ease';

type PostsModule = typeof import('../../blog/posts');

/**
 * Homepage teaser for the blog: the three latest posts. Post data is
 * imported lazily so it shares the blog route's chunk instead of the
 * homepage bundle; with nothing published the tile stays out of the page.
 */
export function WritingTile() {
  const [blog, setBlog] = useState<PostsModule | null>(null);

  useEffect(() => {
    let alive = true;
    import('../../blog/posts').then((mod) => alive && setBlog(mod));
    return () => {
      alive = false;
    };
  }, []);

  const latest = blog?.posts.slice(0, 3) ?? [];
  if (!blog || latest.length === 0) return null;

  return (
    <m.section
      id="writing"
      className="learn-rail"
      aria-labelledby="writing-heading"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
    >
      <div className="learn-rail-intro">
        <h2 id="writing-heading">Writing</h2>
        <p>Longer notes on reliability, operator tooling, and how I scope work.</p>
        <a className="learn-rail-link" href="#/blog">
          Read the blog
          <Icon name="arrowRight" size={14} />
        </a>
      </div>

      <div className="learn-rail-list">
        {latest.map((post, index) => (
          <m.a
            key={post.slug}
            className="writing-item"
            href={`#/blog/${post.slug}`}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 + index * 0.08 }}
          >
            <span className="writing-item-date">{blog.formatPostDate(post.date)}</span>
            <div className="writing-item-body">
              <h3>{post.title}</h3>
              <p>{post.summary}</p>
            </div>
            <Icon name="arrowRight" size={16} className="writing-item-arrow" />
          </m.a>
        ))}
      </div>
    </m.section>
  );
}
