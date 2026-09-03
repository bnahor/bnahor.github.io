/**
 * #/library — the catalogue of what's actually on the shelf.
 *
 * Metadata only, deliberately: the files are mostly published books and this
 * is a public site, so a row says what it is, how long it is, and where to
 * get it legitimately. On this machine the dev server also serves the files,
 * and rows gain an "Open" link straight into the PDF.
 */
import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { Icon } from '../components/Icon';
import { fetchLibrary } from './api';
import { LOCAL_LIBRARY, formatBytes, libraryHref } from './seekUrl';
import type { LibraryItem, LibraryManifest } from './types';

const PAGE_TITLE = 'Rohan Bahl — Founding Engineer at Cortex AI';

/** "reference-library" → "Reference library". */
function label(slug: string): string {
  const words = slug.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/* ---------------------------------------------------------------- row --- */

function LibraryRow({ item }: { item: LibraryItem }) {
  const [copied, setCopied] = useState(false);

  // The site is static, so it cannot write to the vault. What it can do is
  // hand over the exact command that scaffolds the note, pre-filled with the
  // library id — which is the whole of the friction worth removing.
  const command = [
    'npm run new',
    JSON.stringify(item.title),
    '--',
    `--type ${item.kind}`,
    `--library ${item.id}`,
    item.link ? `--source ${item.link}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const copy = () => {
    void navigator.clipboard?.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <article className="lib-row">
      <div className="lib-row-main">
        <h3 className="lib-title">{item.title}</h3>
        {/* The group header above carries the subject, so the row states only
            what the header doesn't: what kind of thing this is. */}
        <p className="lib-sub">
          <span className="lib-kind">{item.kind}</span>
          {item.pages > 0 && <span>{formatBytes(item.bytes)}</span>}
        </p>
      </div>

      <p className="lib-size">{item.pages > 0 ? `${item.pages} pp` : formatBytes(item.bytes)}</p>

      <div className="lib-actions">
        {item.noteId ? (
          <a className="lib-action lib-action--on" href="#/shelf">
            Noted
          </a>
        ) : (
          <button type="button" className="lib-action" onClick={copy} title={command}>
            {copied ? 'Copied' : 'Start notes'}
            <Icon name={copied ? 'check' : 'clipboard'} size={12} />
          </button>
        )}

        {LOCAL_LIBRARY && (
          <a
            className="lib-action"
            href={libraryHref(item.path)}
            target="_blank"
            rel="noreferrer"
          >
            Open
          </a>
        )}

        {item.link ? (
          <a className="lib-action" href={item.link} target="_blank" rel="noreferrer">
            {item.linkKind === 'free' ? 'Read free' : 'Publisher'}
          </a>
        ) : (
          <span className="lib-action lib-action--none">shelf only</span>
        )}
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- page --- */

export default function LibraryView() {
  const [manifest, setManifest] = useState<LibraryManifest | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');

  useEffect(() => {
    document.title = 'Library — Rohan Bahl';
    let alive = true;
    fetchLibrary()
      .then((m) => alive && setManifest(m))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      document.title = PAGE_TITLE;
    };
  }, []);

  const areas = useMemo(() => {
    if (!manifest) return [];
    return [...new Set(manifest.items.map((i) => i.area))].sort();
  }, [manifest]);

  const filtered = useMemo(() => {
    if (!manifest) return [];
    const q = query.trim().toLowerCase();
    return manifest.items.filter((item) => {
      if (area !== 'all' && item.area !== area) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.kind.includes(q)
      );
    });
  }, [manifest, query, area]);

  // Grouped by subject so the catalogue reads as shelves rather than a list
  // of 213 rows.
  const groups = useMemo(() => {
    const bySubject = new Map<string, LibraryItem[]>();
    for (const item of filtered) {
      const key = `${item.area}/${item.subject}`;
      const bucket = bySubject.get(key);
      if (bucket) bucket.push(item);
      else bySubject.set(key, [item]);
    }
    return [...bySubject.entries()];
  }, [filtered]);

  const noted = manifest?.items.filter((i) => i.noteId).length ?? 0;

  return (
    <div className="site-shell">
      <div className="time-grid" aria-hidden="true" />
      <SiteHeader />

      <main id="main-content" className="site-main shelf-main">
        <a className="shelf-back" href="#/">
          <Icon name="arrowRight" size={13} className="shelf-back-icon" />
          Portfolio
        </a>

        <header className="shelf-heading">
          <div>
            <h1 className="section-title section-title--compact">The Library</h1>
            <p className="section-description">
              Every book, paper and lecture deck I keep locally — the queue the shelf draws
              from. This is a catalogue, not a mirror: the files stay on my machine, and each
              row links to wherever the work is actually published.
            </p>
          </div>
          {manifest && (
            <p className="shelf-stats">
              <span>{manifest.items.length} items</span>
              <span>
                {noted} with notes · {formatBytes(manifest.totalBytes)}
              </span>
            </p>
          )}
        </header>

        <div className="shelf-controls">
          <div className="shelf-chips" role="group" aria-label="Filter by area">
            {['all', ...areas].map((a) => (
              <button
                key={a}
                type="button"
                className={`chip${area === a ? ' is-on' : ''}`}
                aria-pressed={area === a}
                onClick={() => setArea(a)}
              >
                {a === 'all' ? 'all' : label(a)}
              </button>
            ))}
          </div>
          <label className="shelf-search">
            <span className="visually-hidden">Search the library</span>
            <input
              type="search"
              value={query}
              placeholder="search title, subject…"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {failed ? (
          <p className="shelf-fallback">
            The catalogue didn&apos;t load — it may not have been compiled for this deploy.
          </p>
        ) : !manifest ? (
          <p className="shelf-fallback">Loading the catalogue…</p>
        ) : groups.length === 0 ? (
          <p className="shelf-fallback">Nothing matches that filter.</p>
        ) : (
          <div className="lib-groups">
            {groups.map(([key, items]) => {
              const first = items[0];
              if (!first) return null;
              return (
                <section key={key} className="lib-group">
                  <h2 className="lib-group-head">
                    <span>{label(first.area)}</span>
                    {first.subject && (
                      <span className="lib-group-sub">{first.subject.replace(/ \/ /g, ' › ')}</span>
                    )}
                    <span className="lib-group-count">{String(items.length).padStart(2, '0')}</span>
                  </h2>
                  <div className="lib-rows">
                    {items.map((item) => (
                      <LibraryRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Rohan Bahl</p>
        <p>
          {LOCAL_LIBRARY
            ? 'Local mode — files served from this machine.'
            : 'Catalogue only. Files are not hosted here.'}
        </p>
      </footer>
    </div>
  );
}
