import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { fetchManifest } from '../../learn/api';
import type { LearnManifest } from '../../learn/types';

/**
 * Homepage summary of the learning log: what's active, how far in, how much
 * is queued. Data is fetched lazily; if nothing has been ingested yet the
 * tile stays out of the page entirely.
 */
export function LearnTile() {
  const [manifest, setManifest] = useState<LearnManifest | null>(null);

  useEffect(() => {
    let alive = true;
    fetchManifest()
      .then((m) => alive && setManifest(m))
      .catch(() => alive && setManifest(null));
    return () => {
      alive = false;
    };
  }, []);

  if (!manifest) return null;

  const active = manifest.entries.filter((e) => e.status === 'active').slice(0, 3);
  const queued = manifest.entries.filter((e) => e.status === 'queued').length;
  const done = manifest.entries.filter((e) => e.status === 'done').length;

  return (
    <div className="notes-column">
      <h3 className="notes-head">On the shelf</h3>
      <ul className="notes-list">
        {active.map((entry) => (
          <li key={entry.id}>
            <a className="notes-row" href="#/shelf">
              <span className="notes-title">{entry.title}</span>
              <span className="notes-meta">
                {entry.kind}, {entry.progress}% through
              </span>
            </a>
          </li>
        ))}
        {active.length === 0 && (
          <li className="notes-empty">
            Nothing in progress. {queued} queued, {done} finished.
          </li>
        )}
      </ul>
      <span className="notes-links">
        <a className="text-link" href="#/shelf">
          The shelf
          <Icon name="arrowRight" size={14} />
        </a>
        <a className="text-link" href="#/library">
          The library
          <Icon name="arrowRight" size={14} />
        </a>
      </span>
    </div>
  );
}
