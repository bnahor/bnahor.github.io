import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { Icon } from '../components/Icon';
import { KineticTitle } from '../components/KineticTitle';
import { SITE_TITLE } from '../data/profile';
import { formatPostDate, postTags, posts, type Post } from './posts';
import { Prose } from './Prose';

/** `#/blog/<slug>` → slug; `#/blog` → null. */
function readSlug(): string | null {
  const match = /^#\/blog\/([^/?#]+)/.exec(window.location.hash);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function useSlug() {
  const [slug, setSlug] = useState(readSlug);
  useEffect(() => {
    const onChange = () => setSlug(readSlug());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return slug;
}

/* --------------------------------------------------------------- index -- */

function PostIndex() {
  const [tag, setTag] = useState<string>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (tag !== 'all' && !post.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [tag, query]);

  return (
    <>
      <header className="page-head">
        <KineticTitle lines={['Writing']} />
        <p className="page-lede">Notes on reliability, operator tooling and how I scope work.</p>
        <p className="page-stats">
          <span>
            {posts.length} post{posts.length === 1 ? '' : 's'}
          </span>
          {posts[0] && <span>latest {formatPostDate(posts[0].date)}</span>}
        </p>
      </header>

      {posts.length > 0 && (
        <div className="shelf-controls">
          <div className="shelf-chips" role="group" aria-label="Filter by tag">
            {['all', ...postTags].map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${tag === t ? ' is-on' : ''}`}
                aria-pressed={tag === t}
                onClick={() => setTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="shelf-search">
            <span className="visually-hidden">Search posts</span>
            <input
              type="search"
              value={query}
              placeholder="search title, tag…"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="page-note">Nothing published yet.</p>
      ) : filtered.length === 0 ? (
        <p className="page-note">Nothing matches that filter.</p>
      ) : (
        <ol className="post-list">
            {filtered.map((post) => (
              <li key={post.slug}>
                <a className="post-row" href={`#/blog/${post.slug}`}>
                  <span className="post-row-date">{formatPostDate(post.date)}</span>
                  <span className="post-row-main">
                    <span className="post-row-title">
                      {post.title}
                      {post.draft && <span className="post-draft">draft</span>}
                    </span>
                    <span className="post-row-summary">{post.summary}</span>
                  </span>
                  <span className="post-row-meta">
                    <span>{post.tags.join(' · ')}</span>
                    <span>{post.readingMinutes} min</span>
                  </span>
                                  </a>
              </li>
            ))}
        </ol>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- post -- */

function PostPage({ post }: { post: Post }) {
  const index = posts.findIndex((p) => p.slug === post.slug);
  const newer = posts[index - 1];
  const older = posts[index + 1];

  return (
    <article className="post">
      <header className="post-header">
        <p className="post-meta">
          <time dateTime={post.date}>{formatPostDate(post.date, 'long')}</time>
          <span>{post.readingMinutes} min read</span>
          {post.draft && <span className="post-draft">draft</span>}
        </p>
        <h1 className="post-title">{post.title}</h1>
        <p className="post-summary">{post.summary}</p>
        {post.tags.length > 0 && (
          <p className="post-tags">
            {post.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
        )}
      </header>

      <Prose source={post.body} />

      {(newer || older) && (
        <nav className="post-pager" aria-label="More posts">
          {older ? (
            <a href={`#/blog/${older.slug}`}>
              <span>Older</span>
              {older.title}
            </a>
          ) : (
            <span />
          )}
          {newer && (
            <a href={`#/blog/${newer.slug}`} className="post-pager-next">
              <span>Newer</span>
              {newer.title}
            </a>
          )}
        </nav>
      )}
    </article>
  );
}

/* ---------------------------------------------------------------- page -- */

export default function BlogView() {
  const slug = useSlug();
  const post = slug ? posts.find((p) => p.slug === slug) : undefined;

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = post ? `${post.title} — Rohan Bahl` : 'Writing — Rohan Bahl';
  }, [slug, post]);

  useEffect(() => () => void (document.title = SITE_TITLE), []);

  return (
    <div className="page">
      <SiteHeader />

      <main id="main-content" className="page-main">
        <a className="page-back" href={slug ? '#/blog' : '#/'}>
          <Icon name="arrowRight" size={13} className="page-back-icon" />
          {slug ? 'All writing' : 'Portfolio'}
        </a>

          <div key={slug ?? 'index'} className="route">
            {!slug ? (
              <PostIndex />
            ) : post ? (
              <PostPage post={post} />
            ) : (
              <p className="page-note">
                That post doesn&apos;t exist — it may have been renamed.{' '}
                <a className="ln" href="#/blog">
                  See all writing
                </a>
                .
              </p>
            )}
          </div>
      </main>

      <footer className="page-footer">
        <p>© {new Date().getFullYear()} Rohan Bahl</p>
        <p>Written in markdown. Compiled with the site.</p>
      </footer>
    </div>
  );
}
