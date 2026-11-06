import type { ReactNode } from 'react';

type ReadingHeadProps = {
  current: 'shelf' | 'library';
  lede: string;
  stats?: ReactNode;
};

/** Shelf and library are two views of one thing: what I read, and what's queued for it. */
export function ReadingHead({ current, lede, stats }: ReadingHeadProps) {
  return (
    <header className="page-head">
      <h1 className="page-title">Reading</h1>
      <nav className="page-tabs" aria-label="Reading">
        <a href="#/shelf" aria-current={current === 'shelf' ? 'page' : undefined}>
          Shelf
        </a>
        <a href="#/library" aria-current={current === 'library' ? 'page' : undefined}>
          Library
        </a>
      </nav>
      <p className="page-lede">{lede}</p>
      {stats && <p className="page-stats">{stats}</p>}
    </header>
  );
}
