import { useEffect, useState } from 'react';
import { Icon } from '../Icon';

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
    <section id="writing" className="reel-section" aria-labelledby="writing-heading">
      <h2 id="writing-heading" className="reel-title">Writing</h2>
      <div className="notes-column">
      <ul className="notes-list">
        {latest.map((post) => (
          <li key={post.slug}>
            <a className="notes-row" href={`#/blog/${post.slug}`}>
              <span className="notes-title">{post.title}</span>
              <span className="notes-meta">{blog.formatPostDate(post.date)}</span>
            </a>
          </li>
        ))}
      </ul>
      <a className="text-link" href="#/blog">
        All writing
        <Icon name="arrowRight" size={14} />
      </a>
      </div>
    </section>
  );
}
