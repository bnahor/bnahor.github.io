import { useEffect, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { SiteHeader } from '../components/SiteHeader';
import { Icon } from '../components/Icon';
import { fetchEntry, fetchManifest } from './api';
import { LOCAL_LIBRARY, buildSeekUrl, formatSeconds, libraryHref, pageHref } from './seekUrl';
import { NoteLines } from './markdown';
import type { LearnEntry, ManifestEntry } from './types';

const STATUS_FILTERS = ['all', 'active', 'queued', 'done', 'shelved'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const PAGE_TITLE = 'Rohan Bahl — Founding Engineer at Cortex AI';

function relDays(iso: string): string {
  const then = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* -------------------------------------------------------------- one row -- */

function EntryBody({ entry }: { entry: LearnEntry }) {
  return (
    <div className="shelf-entry">
      <div className="shelf-entry-meta">
        {entry.source && (
          <a className="shelf-source" href={entry.source} target="_blank" rel="noreferrer">
            Source
            <Icon name="arrowRight" size={12} />
          </a>
        )}
        {LOCAL_LIBRARY && entry.libraryPath && (
          <a
            className="shelf-source"
            href={libraryHref(entry.libraryPath)}
            target="_blank"
            rel="noreferrer"
          >
            Local copy
            <Icon name="arrowRight" size={12} />
          </a>
        )}
        {entry.started && <span>started {entry.started}</span>}
        {entry.finished && <span>finished {entry.finished}</span>}
        <span>touched {relDays(entry.updated)}</span>
        {entry.tags.length > 0 && <span className="shelf-tags">{entry.tags.join(' · ')}</span>}
      </div>

      <div className="shelf-entry-blocks">
        {entry.blocks.map((block, i) => {
          if (block.kind === 'marker') {
            const href = buildSeekUrl(entry.source, { seconds: block.seconds });
            return (
              <div key={i} className="marker">
                {href !== '#' ? (
                  <a className="marker-time" href={href} target="_blank" rel="noreferrer">
                    {formatSeconds(block.seconds)}
                  </a>
                ) : (
                  <span className="marker-time marker-time--plain">
                    {formatSeconds(block.seconds)}
                  </span>
                )}
                <div className="marker-text">
                  <NoteLines lines={block.lines} />
                </div>
              </div>
            );
          }

          if (block.kind === 'page') {
            // Prefers the local file, then the publisher's PDF; a landing
            // page gets no `#page=` fragment, because it would not honour it.
            const href = pageHref(entry, block.page);
            return (
              <div key={i} className="marker">
                {href ? (
                  <a className="marker-time" href={href} target="_blank" rel="noreferrer">
                    p.&thinsp;{block.page}
                  </a>
                ) : (
                  <span className="marker-time marker-time--plain">p.&thinsp;{block.page}</span>
                )}
                <div className="marker-text">
                  <NoteLines lines={block.lines} />
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="note-block">
              <NoteLines lines={block.lines} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShelfRow({ entry, index }: { entry: ManifestEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState<LearnEntry | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || full || failed) return;
    let alive = true;
    fetchEntry(entry.id)
      .then((e) => alive && setFull(e))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [open, full, failed, entry.id]);

  return (
    <article className={`shelf-row${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="shelf-row-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="shelf-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="shelf-title">{entry.title}</span>
        <span className="shelf-kind">{entry.kind}</span>
        <span className={`shelf-status shelf-status--${entry.status}`}>{entry.status}</span>
        <span className="shelf-pct">{String(entry.progress).padStart(2, '0')}%</span>
        <span className="shelf-chevron" aria-hidden="true">
          <Icon name={open ? 'close' : 'arrowDown'} size={13} />
        </span>
      </button>

      {open && (
        <m.div
          className="shelf-row-body"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {full ? (
            <EntryBody entry={full} />
          ) : failed ? (
            <p className="shelf-empty-note">Notes for this entry didn&apos;t load.</p>
          ) : (
            <p className="shelf-empty-note">Loading notes…</p>
          )}
        </m.div>
      )}
    </article>
  );
}

/* --------------------------------------------------------------- page ---- */

export default function ShelfView() {
  const [entries, setEntries] = useState<ManifestEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    document.title = 'Shelf — Rohan Bahl';
    let alive = true;
    fetchManifest()
      .then((m) => alive && setEntries(m.entries))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      document.title = PAGE_TITLE;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (status !== 'all' && e.status !== status) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.kind.includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.blurb.toLowerCase().includes(q)
      );
    });
  }, [entries, query, status]);

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
            <h1 className="section-title section-title--compact">The Shelf</h1>
            <p className="section-description">
              Everything I&apos;m reading and watching, with notes anchored to the source.
              Timestamps seek into the video; page markers point back into the book.
            </p>
          </div>
          {entries && (
            <p className="shelf-stats">
              <span>{entries.length} entries</span>
              <span>
                {entries.filter((e) => e.status === 'active').length} active ·{' '}
                {entries.filter((e) => e.status === 'queued').length} queued
              </span>
            </p>
          )}
        </header>

        <div className="shelf-controls">
          <div className="shelf-chips" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip${status === f ? ' is-on' : ''}`}
                aria-pressed={status === f}
                onClick={() => setStatus(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="shelf-search">
            <span className="visually-hidden">Search notes</span>
            <input
              type="search"
              value={query}
              placeholder="search title, tag, note…"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {failed ? (
          <p className="shelf-fallback">
            The shelf didn&apos;t load — the notes catalogue may not have been ingested for this
            deploy.
          </p>
        ) : !entries ? (
          <p className="shelf-fallback">Loading shelf…</p>
        ) : filtered.length === 0 ? (
          <p className="shelf-fallback">Nothing matches that filter yet.</p>
        ) : (
          <div className="shelf-list">
            {filtered.map((entry, i) => (
              <ShelfRow key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Rohan Bahl</p>
        <p>Notes authored in Obsidian. Compiled to the shelf.</p>
      </footer>
    </div>
  );
}
