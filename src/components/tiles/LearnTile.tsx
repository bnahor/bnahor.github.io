import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { fetchManifest } from '../../learn/api';
import type { LearnManifest } from '../../learn/types';

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
  const anchors = manifest.entries.reduce((sum, e) => sum + e.markerCount, 0);

  return (
    <section className="learn-rail" aria-labelledby="learn-heading">
      <div className="learn-rail-intro">
        <h2 id="learn-heading">On the shelf</h2>
        <p>
          Lectures and books I&apos;m working through, with notes anchored to the
          source — every timestamp links back into the video.
        </p>
        <a className="learn-rail-link" href="#/shelf">
          Open the shelf
          <Icon name="arrowRight" size={14} />
        </a>
      </div>

      <div className="learn-rail-list">
        {active.length === 0 && (
          <p className="learn-rail-empty">
            Nothing mid-flight right now — the queue holds {queued} item
            {queued === 1 ? '' : 's'}.
          </p>
        )}

        {active.map((entry) => (
          <article key={entry.id} className="learn-item">
            <div className="learn-item-head">
              <span className="learn-item-kind">{entry.kind}</span>
              <h3>{entry.title}</h3>
              <span className="learn-item-age">{relDays(entry.updated)}</span>
            </div>
            <div
              className="learn-bar"
              role="progressbar"
              aria-label={`${entry.title} — ${entry.progress}% through`}
              aria-valuenow={entry.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className="learn-bar-fill" style={{ width: `${entry.progress}%` }} />
            </div>
            <p className="learn-item-meta">
              <span>{String(entry.progress).padStart(2, '0')}%</span>
              <span>
                {entry.markerCount} anchor{entry.markerCount === 1 ? '' : 's'}
              </span>
            </p>
          </article>
        ))}

        <p className="learn-rail-foot">
          <span>
            {String(queued).padStart(2, '0')} queued · {String(done).padStart(2, '0')} finished
          </span>
          <span>
            {String(anchors).padStart(2, '0')} timestamped anchors across{' '}
            {manifest.entries.length} note{manifest.entries.length === 1 ? '' : 's'}
          </span>
        </p>
      </div>
    </section>
  );
}
